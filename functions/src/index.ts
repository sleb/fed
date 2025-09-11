import * as admin from "firebase-admin";
import { defineSecret, defineString } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Resend } from "resend";
import { Companionship, SignupFirestore } from "./types.js";

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
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
if (!RESEND_API_KEY) {
  throw new Error(
    "RESEND_API_KEY secret is required. Set it in your Firebase project secrets.",
  );
}

// Collection to track pending email batches
const PENDING_EMAILS_COLLECTION = "pendingEmailBatches";
const BATCH_DELAY_MS = 5 * 60 * 1000; // 5 minutes

// Function triggered when a new signup is created
export const onSignupCreated = onDocumentCreated(
  {
    document: "signups/{signupId}",
    secrets: [RESEND_API_KEY],
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

  const resend = new Resend(RESEND_API_KEY.value());
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

// This function is no longer used - replaced by batched email system
// Keeping for reference in case we need to fall back to immediate emails
