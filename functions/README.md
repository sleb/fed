# Email Functions - Batched Notifications

This directory contains Firebase Cloud Functions that handle batched email notifications for the Missionary Dinner Calendar application.

## Features

- **Batched Email System**: Groups multiple signups by the same user within a 5-minute window
- **Single Confirmation Email**: Sends one email with all recent signups instead of multiple emails
- **Real-time Triggers**: Uses Firestore triggers to ensure reliable email delivery
- **Emulator Support**: Automatically detects emulator environment and logs emails instead of sending them

## How Batching Works

1. **First Signup**: Creates a new email batch document in `pendingEmailBatches` collection
2. **Subsequent Signups**: Added to existing batch if created within 5 minutes by same user
3. **Email Delivery**: After 5 minutes, sends single email with all signups in the batch
4. **Batch Processing**: Marks batch as processed to prevent duplicate emails

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Secrets

Set up the Resend API key as a Firebase secret (secure):

```bash
# Get your API key from https://resend.com/api-keys
firebase functions:secrets:set RESEND_API_KEY
# Enter your actual API key when prompted: re_your_actual_key_here
```

### 3. Update Email Configuration (if needed)

The function uses hardcoded constants for simplicity:

```typescript
const EMAIL_FROM = "Missionary Dinner Calendar <noreply@well-fed.app>";
const APP_BASE_URL = "https://well-fed.app";
```

To change these values, edit them directly in `src/index.ts`.

### 4. Verify Your Domain in Resend

1. Go to [Resend Domains](https://resend.com/domains)
2. Add and verify `well-fed.app` (or update the EMAIL_FROM constant to your domain)

### 5. Deploy Functions

Note: The RESEND_API_KEY secret will be automatically deployed with your functions.

```bash
# From the project root
firebase deploy --only functions
```

## Local Development

### Emulator Mode

The function automatically detects when running in the Firebase emulator:

- Uses `FUNCTIONS_EMULATOR` environment variable for detection
- Emails are logged to console instead of being sent
- No secrets required for emulator testing
- Shows batching behavior in logs

### Running Emulators

```bash
# From project root
firebase emulators:start --only functions,firestore
```

### Testing the Batching System

Create multiple signups for the same user within 5 minutes:

```javascript
// Example: Create 3 signups for same user
const signups = [
  { userId: "user123", userEmail: "test@example.com" /* ... */ },
  { userId: "user123", userEmail: "test@example.com" /* ... */ },
  { userId: "user123", userEmail: "test@example.com" /* ... */ },
];
```

Expected behavior:

1. First signup creates email batch
2. Other signups added to same batch
3. After 5 minutes: single email with all 3 signups
4. Batch marked as processed

## Email Template

The batched confirmation email includes:

- **Multiple Signups**: Each signup shown as separate section
- **Event Details**: Date, missionaries, area, guest count for each
- **User Notes**: Individual notes for each signup (if provided)
- **Single Action Button**: View calendar link
- **Mobile Responsive**: Works well on all devices

### Single vs Multiple Signups

- **Single Signup**: "Dinner Confirmed - [Date]"
- **Multiple Signups**: "3 Dinners Confirmed" (shows count)

## Architecture

```
Firestore signup created
    ↓
Check for existing user batch
    ↓
Add to existing OR create new batch
    ↓
Schedule batch processing (5 min)
    ↓
Fetch all signups + companionship data
    ↓
Generate batched HTML/text email
    ↓
Send via Resend API
    ↓
Mark batch as processed
```

## Data Structure

### Pending Email Batch Document

```typescript
interface PendingEmailBatch {
  userId: string;
  userEmail: string;
  userName: string;
  signupIds: string[];
  scheduledSendTime: Timestamp;
  createdAt: Timestamp;
  lastSignupAt: Timestamp;
  processed: boolean;
  processedAt?: Timestamp;
  error?: string;
}
```

## Error Handling

- Email failures do not prevent signup creation
- Batches marked as processed even if email fails (prevents infinite retries)
- Missing companionship/missionary data handled gracefully
- Detailed error logging for troubleshooting

## Monitoring

### Checking Logs

```bash
# View function logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --follow
```

### Key Metrics to Monitor

- Batch creation rate
- Email delivery success rate
- Processing time per batch
- Failed batches requiring attention

## Troubleshooting

### Common Issues

1. **Function not triggering**: Check Firestore rules allow document creation
2. **Email not sending in production**: Verify `RESEND_API_KEY` secret is set and domain configuration
3. **Build errors**: Run `npm run build` in functions directory
4. **Batches not processing**: Check for setTimeout issues in Cloud Functions environment
5. **Secret not found**: Ensure `firebase functions:secrets:set RESEND_API_KEY` was run

### Debug Queries

```javascript
// Find pending batches
db.collection("pendingEmailBatches").where("processed", "==", false).get();

// Find failed batches
db.collection("pendingEmailBatches").where("error", "!=", null).get();
```

## Production Checklist

- [ ] Valid Resend API key set as Firebase secret (`firebase functions:secrets:set RESEND_API_KEY`)
- [ ] Domain in `EMAIL_FROM` constant verified in Resend
- [ ] Update `EMAIL_FROM` and `APP_BASE_URL` constants in source if needed
- [ ] Functions deployed successfully
- [ ] Test batching flow end-to-end
- [ ] Monitor function logs for errors
- [ ] Set up alerting for failed batches

## Secret Management

### Setting Secrets

```bash
# Set the API key (interactive prompt)
firebase functions:secrets:set RESEND_API_KEY

# View configured secrets
firebase functions:secrets:access RESEND_API_KEY

# Update a secret
firebase functions:secrets:set RESEND_API_KEY
```

### Security Benefits

- API keys never stored in code or environment files
- Encrypted at rest and in transit
- Access controlled via Firebase IAM
- Automatic rotation support
- Audit logging for secret access

## Configuration

### Hardcoded Constants

The function uses hardcoded constants for simplicity and reliability:

- `EMAIL_FROM`: The sender email address and display name
- `APP_BASE_URL`: Base URL for email links back to the calendar
- `BATCH_DELAY_MS`: 5-minute delay for email batching

These can be changed directly in the source code if needed.

## Performance Considerations

- **Batch Size**: No hard limit, but very large batches may hit email size limits
- **Timeout**: 5-minute delay is configurable via `BATCH_DELAY_MS`
- **Cleanup**: Consider periodic cleanup of old processed batches
- **Rate Limits**: Resend has sending limits, monitor for large volumes

## Future Enhancements

- Admin notification on batch failures
- Configurable batch delay per user preference
- Reminder emails for upcoming dinners
- Calendar (.ics) file attachments
- Batch size limits and splitting
- Retry logic for failed email deliveries
