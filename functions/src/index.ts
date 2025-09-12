import * as admin from "firebase-admin";
import { defineSecret, defineString } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { Resend } from "resend";
import {
  AdminNotificationFirestore,
  Companionship,
  SentReminderFirestore,
  SignupFirestore,
} from "./types.js";

// Initialize Firebase Admin
admin.initializeApp();

// Email configuration from environment variables (required)
const EMAIL_FROM = defineString("EMAIL_FROM");
if (!EMAIL_FROM) {
  throw new Error(
    "EMAIL_FROM environment variable is required. Set it to something like 'Your App Name <noreply@yourdomain.com>'",
  );
}

const APP_BASE_URL = defineString("APP_BASE_URL");
if (!APP_BASE_URL) {
  throw new Error(
    "APP_BASE_URL environment variable is required. Set it to your application's base URL like 'https://yourdomain.com'",
  );
}

// Check if running in emulator
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

// Define secret for Resend API key
const resendApiKey = defineSecret("RESEND_API_KEY");

// Initialize Resend (only if not in emulator and API key is provided)
const resend =
  !isEmulator && resendApiKey ? new Resend(resendApiKey.value()) : null;

// Collection to track pending email batches
const PENDING_EMAILS_COLLECTION = "pendingEmailBatches";
const BATCH_DELAY_MS = 5 * 60 * 1000; // 5 minutes

// Collections for reminder system
const SENT_REMINDERS_COLLECTION = "sentReminders";
const ADMIN_NOTIFICATIONS_COLLECTION = "adminNotifications";

// Function triggered when a new signup is created
export const onSignupCreated = onDocumentCreated(
  {
    document: "signups/{signupId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("No data associated with the event");
      return;
    }

    const signupData = snap.data();
    if (!signupData) {
      console.log("No signup data found");
      return;
    }
    const signup = { id: snap.id, ...signupData } as SignupFirestore;

    try {
      // Add signup to pending email batch instead of sending immediately
      await addToPendingBatch(signup);

      console.log(
        `Signup ${signup.id} added to pending email batch for user ${signup.userId}`,
      );
    } catch (error) {
      console.log("Failed to add signup to pending batch:", error);
    }
  },
);

async function addToPendingBatch(signup: SignupFirestore) {
  const db = admin.firestore();
  const batchId = `${signup.userId}_${Date.now()}`;
  const batchRef = db.collection(PENDING_EMAILS_COLLECTION).doc(batchId);

  // Check if there's already a pending batch for this user
  const existingBatchQuery = await db
    .collection(PENDING_EMAILS_COLLECTION)
    .where("userId", "==", signup.userId)
    .where("processed", "==", false)
    .limit(1)
    .get();

  if (!existingBatchQuery.empty) {
    // Add to existing batch
    const existingBatchDoc = existingBatchQuery.docs[0];
    const existingData = existingBatchDoc.data();

    await existingBatchDoc.ref.update({
      signupIds: admin.firestore.FieldValue.arrayUnion(signup.id),
      lastSignupAt: admin.firestore.Timestamp.now(),
    });

    console.log(
      `Added signup ${signup.id} to existing batch ${existingBatchDoc.id}`,
    );
  } else {
    // Create new batch
    const scheduledSendTime = admin.firestore.Timestamp.fromMillis(
      Date.now() + BATCH_DELAY_MS,
    );

    await batchRef.set({
      userId: signup.userId,
      userEmail: signup.userEmail,
      userName: signup.userName,
      signupIds: [signup.id],
      scheduledSendTime,
      createdAt: admin.firestore.Timestamp.now(),
      lastSignupAt: admin.firestore.Timestamp.now(),
      processed: false,
    });

    console.log(`Created new email batch ${batchId} for user ${signup.userId}`);

    // Schedule the batch processing
    setTimeout(async () => {
      await processPendingBatch(batchId);
    }, BATCH_DELAY_MS);
  }
}

async function processPendingBatch(batchId: string) {
  const db = admin.firestore();
  const batchRef = db.collection(PENDING_EMAILS_COLLECTION).doc(batchId);

  try {
    const batchDoc = await batchRef.get();
    if (!batchDoc.exists) {
      console.log(`Batch ${batchId} no longer exists`);
      return;
    }

    const batchData = batchDoc.data();
    if (batchData?.processed) {
      console.log(`Batch ${batchId} already processed`);
      return;
    }

    // Get all signups in this batch
    const signupPromises = batchData?.signupIds.map((signupId: string) =>
      db.collection("signups").doc(signupId).get(),
    );

    const signupDocs = await Promise.all(signupPromises);
    const signups = signupDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }) as SignupFirestore);

    if (signups.length === 0) {
      console.log(`No valid signups found for batch ${batchId}`);
      await batchRef.update({ processed: true });
      return;
    }

    // Send batched confirmation email
    await sendBatchedConfirmationEmail(
      signups,
      batchData?.userEmail,
      batchData?.userName,
    );

    // Mark batch as processed
    await batchRef.update({
      processed: true,
      processedAt: admin.firestore.Timestamp.now(),
    });

    console.log(
      `Successfully processed batch ${batchId} with ${signups.length} signups`,
    );
  } catch (error) {
    console.error(`Failed to process batch ${batchId}:`, error);

    // Mark as processed to prevent infinite retries
    await batchRef.update({
      processed: true,
      processedAt: admin.firestore.Timestamp.now(),
      error: error?.toString(),
    });
  }
}

async function sendBatchedConfirmationEmail(
  signups: SignupFirestore[],
  userEmail: string,
  userName: string,
) {
  // Get companionship details for all signups
  const companionshipIds = [...new Set(signups.map((s) => s.companionshipId))];
  const companionshipDocs = await Promise.all(
    companionshipIds.map((id) =>
      admin.firestore().collection("companionships").doc(id).get(),
    ),
  );

  const companionships = new Map<string, Companionship>();
  companionshipDocs.forEach((doc) => {
    if (doc.exists) {
      companionships.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      } as Companionship);
    }
  });

  // Group signups with their companionship data and get missionary names
  const signupDetails = await Promise.all(
    signups.map(async (signup) => {
      const companionship = companionships.get(signup.companionshipId);
      if (!companionship) return null;

      // Get missionary names
      let missionaryNames = companionship.area;
      try {
        if (
          companionship.missionaryIds &&
          companionship.missionaryIds.length > 0
        ) {
          const missionaryDocs = await Promise.all(
            companionship.missionaryIds.map((id: string) =>
              admin.firestore().collection("missionaries").doc(id).get(),
            ),
          );

          const missionaries = missionaryDocs
            .filter((doc: admin.firestore.DocumentSnapshot) => doc.exists)
            .map((doc: admin.firestore.DocumentSnapshot) => doc.data()?.name)
            .filter(Boolean);

          if (missionaries.length > 0) {
            missionaryNames = missionaries.sort().join(" & ");
          }
        }
      } catch (error) {
        console.log(
          "Could not fetch missionary names, using area name:",
          error,
        );
      }

      return {
        signup,
        companionship,
        missionaryNames,
        formattedDate: signup.dinnerDate.toDate().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    }),
  );

  const validSignupDetails = signupDetails.filter(
    (detail): detail is NonNullable<typeof detail> => detail !== null,
  );
  if (validSignupDetails.length === 0) {
    console.log("No valid signup details found for email");
    return;
  }

  // Sort by dinner date
  validSignupDetails.sort(
    (a, b) => a!.signup.dinnerDate.toMillis() - b!.signup.dinnerDate.toMillis(),
  );

  const isMultiple = validSignupDetails.length > 1;
  const subject = isMultiple
    ? `${validSignupDetails.length} Dinner Signups Confirmed`
    : `Dinner Confirmed - ${validSignupDetails[0]!.formattedDate}`;

  const emailHtml = generateBatchedEmailHtml(
    validSignupDetails,
    userName,
    isMultiple,
  );
  const emailText = generateBatchedEmailText(
    validSignupDetails,
    userName,
    isMultiple,
  );

  // Emulator mode: log email instead of sending
  if (isEmulator) {
    console.log("=== EMULATOR MODE: Batched email would be sent ===");
    console.log("From:", EMAIL_FROM.value());
    console.log("To:", userEmail);
    console.log("Subject:", subject);
    console.log("Signups count:", validSignupDetails.length);
    console.log("HTML Length:", emailHtml.length);
    console.log("Text:", emailText);
    console.log("=== End Emulator Mode ===");
    return;
  }

  // Production mode: check for API key
  if (!resend) {
    console.error("RESEND_API_KEY not configured - email not sent");
    throw new Error("Email service not properly configured");
  }

  await resend.emails.send({
    from: EMAIL_FROM.value(),
    to: [userEmail],
    subject,
    html: emailHtml,
    text: emailText,
  });
}

function generateBatchedEmailHtml(
  signupDetails: Array<{
    signup: SignupFirestore;
    companionship: Companionship;
    missionaryNames: string;
    formattedDate: string;
  }>,
  userName: string,
  isMultiple: boolean,
): string {
  const signupRows = signupDetails
    .map(
      (detail) => `
    <div class="signup-item">
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${detail.formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Missionaries:</span>
        <span class="detail-value">${detail.missionaryNames}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Area:</span>
        <span class="detail-value">${detail.companionship.area}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Number of Guests:</span>
        <span class="detail-value">${detail.signup.guestCount}</span>
      </div>
      ${
        detail.signup.notes
          ? `
      <div class="detail-row">
        <span class="detail-label">Your Notes:</span>
        <span class="detail-value">${detail.signup.notes}</span>
      </div>
      `
          : ""
      }
    </div>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dinner Signup${isMultiple ? "s" : ""} Confirmed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .signup-item {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .signup-item:first-child {
            margin-top: 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #64748b;
          }
          .detail-value {
            color: #334155;
          }
          .actions {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
          }
          .btn-primary {
            background-color: #667eea;
            color: white;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            body { padding: 10px; }
            .header, .content { padding: 20px; }
            .btn { display: block; margin: 10px 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">
            ${isMultiple ? `${signupDetails.length} Dinners` : "Dinner"} Confirmed! 🍽️
          </h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            Thank you for signing up to host the missionaries
          </p>
        </div>

        <div class="content">
          <p>Hi ${userName},</p>

          <p>
            ${
              isMultiple
                ? `Your ${signupDetails.length} dinner signups have been confirmed! We're excited that you'll be hosting the missionaries multiple times.`
                : `Your dinner signup has been confirmed! We're excited that you'll be hosting the missionaries.`
            }
          </p>

          ${signupRows}

          <div class="actions">
            <a href="${APP_BASE_URL.value()}/calendar" class="btn btn-primary">
              View Calendar
            </a>
          </div>

          <p>If you need to make any changes or have questions about your signup${isMultiple ? "s" : ""}, you can use the link above or contact your local leadership.</p>

          <p>Thanks again for your service!</p>
        </div>

        <div class="footer">
          <p>This is an automated message from the Missionary Dinner Calendar system.</p>
        </div>
      </body>
    </html>
  `;
}

function generateBatchedEmailText(
  signupDetails: Array<{
    signup: SignupFirestore;
    companionship: Companionship;
    missionaryNames: string;
    formattedDate: string;
  }>,
  userName: string,
  isMultiple: boolean,
): string {
  const signupText = signupDetails
    .map(
      (detail, index) => `
${isMultiple ? `Signup ${index + 1}:` : ""}
Date: ${detail.formattedDate}
Missionaries: ${detail.missionaryNames}
Area: ${detail.companionship.area}
Number of Guests: ${detail.signup.guestCount}
${detail.signup.notes ? `Your Notes: ${detail.signup.notes}` : ""}
  `,
    )
    .join("\n");

  return `
Dinner${isMultiple ? "s" : ""} Confirmed

Hi ${userName},

${
  isMultiple
    ? `Your ${signupDetails.length} dinner signups have been confirmed! Here are the details:`
    : `Your dinner signup has been confirmed! Here are the details:`
}

${signupText}

You can view your signup${isMultiple ? "s" : ""} or make changes at: ${APP_BASE_URL.value()}/calendar

Thanks for your service!
  `;
}

// Daily scheduled function to send dinner reminders
export const sendDailyReminders = onSchedule(
  {
    schedule: "0 9 * * *", // Daily at 9 AM
    timeZone: "America/Denver", // Mountain Time
    secrets: [resendApiKey],
  },
  async (event) => {
    console.log("Starting daily reminder check...");

    try {
      const remindersToSend = await findSignupsNeedingReminders();
      console.log(`Found ${remindersToSend.length} reminders to send`);

      for (const reminder of remindersToSend) {
        try {
          await sendReminderEmail(reminder);
          await recordReminderSent(reminder, "sent");
          console.log(`Sent reminder for signup ${reminder.signup.id}`);
        } catch (error) {
          console.error(
            `Failed to send reminder for signup ${reminder.signup.id}:`,
            error,
          );
          await recordReminderSent(reminder, "failed", error?.toString());
          await createAdminNotification(
            "email_failure",
            `Failed to send reminder for signup ${reminder.signup.id}`,
            { signupId: reminder.signup.id, error: error?.toString() },
          );
        }
      }

      console.log("Daily reminder check completed");
    } catch (error) {
      console.error("Error in daily reminder process:", error);
      await createAdminNotification(
        "email_failure",
        "Daily reminder process failed",
        { error: error?.toString() },
      );
    }
  },
);

async function findSignupsNeedingReminders() {
  const db = admin.firestore();
  const today = new Date();

  // Get all signups with future dinner dates
  const signupsQuery = await db
    .collection("signups")
    .where("dinnerDate", ">", admin.firestore.Timestamp.fromDate(today))
    .get();

  const remindersToSend = [];

  for (const signupDoc of signupsQuery.docs) {
    const signup = { id: signupDoc.id, ...signupDoc.data() } as SignupFirestore;

    // Get user preferences
    const userDoc = await db.collection("users").doc(signup.userId).get();
    if (!userDoc.exists) continue;

    const userData = userDoc.data();
    if (!userData?.preferences?.signupReminders) continue;

    // Calculate reminder date
    const dinnerDate = signup.dinnerDate.toDate();
    const reminderDaysBefore = userData.preferences.reminderDaysBefore || 1;
    const reminderDate = new Date(dinnerDate);
    reminderDate.setDate(dinnerDate.getDate() - reminderDaysBefore);

    // Check if reminder should be sent today
    const isReminderDay = reminderDate.toDateString() === today.toDateString();

    if (!isReminderDay) continue;

    // Check if we already sent a reminder for this signup
    const existingReminderQuery = await db
      .collection(SENT_REMINDERS_COLLECTION)
      .where("signupId", "==", signup.id)
      .where("reminderType", "==", "signup_reminder")
      .limit(1)
      .get();

    if (!existingReminderQuery.empty) continue;

    // Get companionship details
    const companionshipDoc = await db
      .collection("companionships")
      .doc(signup.companionshipId)
      .get();

    if (companionshipDoc.exists) {
      const companionship = {
        id: companionshipDoc.id,
        ...companionshipDoc.data(),
      } as Companionship;

      remindersToSend.push({
        signup,
        companionship,
        user: userData,
        reminderDaysBefore,
      });
    }
  }

  return remindersToSend;
}

async function sendReminderEmail(reminder: {
  signup: SignupFirestore;
  companionship: Companionship;
  user: any;
  reminderDaysBefore: number;
}) {
  const { signup, companionship, user, reminderDaysBefore } = reminder;

  // Get missionary names
  let missionaryNames = companionship.area;
  try {
    if (companionship.missionaryIds && companionship.missionaryIds.length > 0) {
      const missionaryDocs = await Promise.all(
        companionship.missionaryIds.map((id: string) =>
          admin.firestore().collection("missionaries").doc(id).get(),
        ),
      );

      const missionaries = missionaryDocs
        .filter((doc) => doc.exists)
        .map((doc) => doc.data()?.name)
        .filter(Boolean);

      if (missionaries.length > 0) {
        missionaryNames = missionaries.sort().join(" & ");
      }
    }
  } catch (error) {
    console.log("Could not fetch missionary names, using area name:", error);
  }

  const dinnerDate = signup.dinnerDate.toDate();
  const formattedDate = dinnerDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dayText =
    reminderDaysBefore === 1 ? "tomorrow" : `in ${reminderDaysBefore} days`;
  const subject = `Reminder: Dinner with Missionaries ${dayText}`;

  const emailHtml = generateReminderEmailHtml({
    userName: user.name,
    formattedDate,
    missionaryNames,
    companionship,
    signup,
    reminderDaysBefore,
  });

  const emailText = generateReminderEmailText({
    userName: user.name,
    formattedDate,
    missionaryNames,
    companionship,
    signup,
    reminderDaysBefore,
  });

  // Emulator mode: log email instead of sending
  if (isEmulator) {
    console.log("=== EMULATOR MODE: Reminder email would be sent ===");
    console.log("From:", EMAIL_FROM.value());
    console.log("To:", signup.userEmail);
    console.log("Subject:", subject);
    console.log("HTML Length:", emailHtml.length);
    console.log("Text:", emailText);
    console.log("=== End Emulator Mode ===");
    return;
  }

  // Production mode: check for API key
  if (!resend) {
    console.error("RESEND_API_KEY not configured - email not sent");
    throw new Error("Email service not properly configured");
  }

  await resend.emails.send({
    from: EMAIL_FROM.value(),
    to: [signup.userEmail],
    subject,
    html: emailHtml,
    text: emailText,
  });
}

async function recordReminderSent(
  reminder: { signup: SignupFirestore },
  status: "sent" | "failed",
  errorMessage?: string,
) {
  const db = admin.firestore();
  const reminderDoc: Omit<SentReminderFirestore, "id"> = {
    signupId: reminder.signup.id,
    userId: reminder.signup.userId,
    reminderType: "signup_reminder",
    sentAt: admin.firestore.Timestamp.now(),
    emailStatus: status,
    ...(errorMessage && { errorMessage }),
  };

  await db.collection(SENT_REMINDERS_COLLECTION).add(reminderDoc);
}

async function createAdminNotification(
  type: "email_failure",
  message: string,
  details: any,
) {
  const db = admin.firestore();
  const notification: Omit<AdminNotificationFirestore, "id"> = {
    type,
    message,
    details,
    createdAt: admin.firestore.Timestamp.now(),
    resolved: false,
  };

  await db.collection(ADMIN_NOTIFICATIONS_COLLECTION).add(notification);
}

function generateReminderEmailHtml({
  userName,
  formattedDate,
  missionaryNames,
  companionship,
  signup,
  reminderDaysBefore,
}: {
  userName: string;
  formattedDate: string;
  missionaryNames: string;
  companionship: Companionship;
  signup: SignupFirestore;
  reminderDaysBefore: number;
}): string {
  const dayText =
    reminderDaysBefore === 1 ? "tomorrow" : `in ${reminderDaysBefore} days`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dinner Reminder</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .detail-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f093fb;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #64748b;
          }
          .detail-value {
            color: #334155;
          }
          .actions {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            background-color: #f093fb;
            color: white;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            body { padding: 10px; }
            .header, .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🍽️ Dinner Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            Your missionary dinner is ${dayText}!
          </p>
        </div>

        <div class="content">
          <p>Hi ${userName},</p>

          <p>This is a friendly reminder that you're scheduled to host the missionaries for dinner ${dayText}.</p>

          <div class="detail-box">
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Missionaries:</span>
              <span class="detail-value">${missionaryNames}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Area:</span>
              <span class="detail-value">${companionship.area}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Number of Guests:</span>
              <span class="detail-value">${signup.guestCount}</span>
            </div>
            ${
              signup.notes
                ? `
            <div class="detail-row">
              <span class="detail-label">Your Notes:</span>
              <span class="detail-value">${signup.notes}</span>
            </div>
            `
                : ""
            }
            ${
              companionship.phone
                ? `
            <div class="detail-row">
              <span class="detail-label">Companionship Phone:</span>
              <span class="detail-value">${companionship.phone}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="actions">
            <a href="${APP_BASE_URL}/calendar" class="btn">
              View Calendar
            </a>
          </div>

          <p>If you need to make any changes or have questions, you can visit the calendar or contact your local leadership.</p>

          <p>Thank you for your service!</p>
        </div>

        <div class="footer">
          <p>This is an automated reminder from the Missionary Dinner Calendar system.</p>
        </div>
      </body>
    </html>
  `;
}

function generateReminderEmailText({
  userName,
  formattedDate,
  missionaryNames,
  companionship,
  signup,
  reminderDaysBefore,
}: {
  userName: string;
  formattedDate: string;
  missionaryNames: string;
  companionship: Companionship;
  signup: SignupFirestore;
  reminderDaysBefore: number;
}): string {
  const dayText =
    reminderDaysBefore === 1 ? "tomorrow" : `in ${reminderDaysBefore} days`;

  return `
Dinner Reminder

Hi ${userName},

This is a friendly reminder that you're scheduled to host the missionaries for dinner ${dayText}.

Date: ${formattedDate}
Missionaries: ${missionaryNames}
Area: ${companionship.area}
Number of Guests: ${signup.guestCount}
${signup.notes ? `Your Notes: ${signup.notes}` : ""}
${companionship.phone ? `Companionship Phone: ${companionship.phone}` : ""}

You can view your calendar or make changes at: ${APP_BASE_URL.value()}/calendar

Thank you for your service!
  `;
}

// This function is no longer used - replaced by batched email system
// Keeping for reference in case we need to fall back to immediate emails
