import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Resend } from "resend";
import { Companionship, SignupFirestore } from "./types.js";

// Initialize Firebase Admin
admin.initializeApp();

// Check if running in emulator
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

// Initialize Resend (only if not in emulator and API key is provided)
const resend =
  !isEmulator && process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// Function triggered when a new signup is created
export const onSignupCreated = onDocumentCreated(
  "signups/{signupId}",
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
      // Get companionship details
      const companionshipDoc = await admin
        .firestore()
        .collection("companionships")
        .doc(signup.companionshipId)
        .get();

      if (!companionshipDoc.exists) {
        console.error("Companionship not found:", signup.companionshipId);
        return;
      }

      const companionship = {
        id: companionshipDoc.id,
        ...companionshipDoc.data(),
      } as Companionship;

      // Send confirmation email
      await sendConfirmationEmail(signup, companionship);

      console.log(
        "Confirmation email sent successfully for signup:",
        signup.id,
      );
    } catch (error) {
      console.log("Failed to send confirmation email:", error);

      // TODO: In future milestone, notify administrators of email failure
      // For now, we just log the error and don't fail the signup
    }
  },
);

async function sendConfirmationEmail(
  signup: SignupFirestore,
  companionship: Companionship,
) {
  const dinnerDate = signup.dinnerDate.toDate();
  const formattedDate = dinnerDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get missionary names by fetching missionary documents
  let missionaryNames = companionship.area; // Fallback to area name
  try {
    if (companionship.missionaryIds && companionship.missionaryIds.length > 0) {
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
    console.log("Could not fetch missionary names, using area name:", error);
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dinner Signup Confirmation</title>
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
          .details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
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
          .btn-secondary {
            background-color: #64748b;
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
          <h1 style="margin: 0; font-size: 28px;">Dinner Confirmed! 🍽️</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for signing up to host the missionaries</p>
        </div>

        <div class="content">
          <p>Hi ${signup.userName},</p>

          <p>Your dinner signup has been confirmed! We're excited that you'll be hosting the missionaries.</p>

          <div class="details">
            <h3 style="margin-top: 0; color: #334155;">Event Details</h3>
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
          </div>

          <div class="actions">
            <a href="${process.env.APP_BASE_URL}/calendar" class="btn btn-primary">
              View Calendar
            </a>
            <a href="${process.env.APP_BASE_URL}/calendar?signup=${signup.id}" class="btn btn-secondary">
              Change/Cancel
            </a>
          </div>

          <p>If you need to make any changes or have questions about your signup, you can use the links above or contact your local leadership.</p>

          <p>Thanks again for your service!</p>
        </div>

        <div class="footer">
          <p>This is an automated message from the Missionary Dinner Calendar system.</p>
        </div>
      </body>
    </html>
  `;

  const emailText = `
    Dinner Confirmation

    Hi ${signup.userName},

    Your dinner signup has been confirmed! Here are the details:

    Date: ${formattedDate}
    Missionaries: ${missionaryNames}
    Area: ${companionship.area}
    Number of Guests: ${signup.guestCount}
    ${signup.notes ? `Your Notes: ${signup.notes}` : ""}

    You can view your signup or make changes at: ${process.env.APP_BASE_URL}/calendar

    Thanks for your service!
  `;

  // Emulator mode: log email instead of sending
  if (isEmulator) {
    console.log("=== EMULATOR MODE: Email would be sent ===");
    console.log(
      "From:",
      `Missionary Dinner Calendar <noreply@${process.env.EMAIL_FROM_DOMAIN}>`,
    );
    console.log("To:", signup.userEmail);
    console.log("Subject:", `Dinner Confirmed - ${formattedDate}`);
    console.log("HTML Length:", emailHtml.length);
    console.log("Text:", emailText);
    console.log("=== End Emulator Mode ===");
    return;
  }

  // Production mode: check for API key
  if (!resend || !process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured - email not sent");
    throw new Error("Email service not properly configured");
  }

  await resend.emails.send({
    from: `Missionary Dinner Calendar <noreply@${process.env.EMAIL_FROM_DOMAIN}>`,
    to: [signup.userEmail],
    subject: `Dinner Confirmed - ${formattedDate}`,
    html: emailHtml,
    text: emailText,
  });
}
