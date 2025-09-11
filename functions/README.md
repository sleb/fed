# Email Functions Setup

This directory contains Firebase Cloud Functions that handle email notifications for the Missionary Dinner Calendar application.

## Features

- **Signup Confirmation Emails**: Automatically sends HTML confirmation emails when members sign up for dinner slots
- **Real-time Triggers**: Uses Firestore triggers to ensure reliable email delivery
- **Test Mode**: Can run in test mode for development without sending actual emails

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Get your API key from https://resend.com/api-keys
RESEND_API_KEY=re_your_actual_api_key_here

# Your app's base URL (for email links)
APP_BASE_URL=https://yourdomain.com

# Your verified sending domain in Resend
EMAIL_FROM_DOMAIN=yourdomain.com
```

### 3. Verify Your Domain in Resend

1. Go to [Resend Domains](https://resend.com/domains)
2. Add and verify your domain
3. Update `EMAIL_FROM_DOMAIN` in `.env` with your verified domain

### 4. Deploy Functions

```bash
# From the project root
firebase deploy --only functions
```

## Local Development

### Test Mode

The function automatically runs in test mode when:
- `RESEND_API_KEY` is missing or set to `test_mode`
- Emails are logged to console instead of being sent

### Running Emulators

```bash
# From project root
firebase emulators:start --only functions,firestore
```

### Testing the Function

Create a test signup document in Firestore to trigger the email function:

```javascript
// In Firestore emulator or console
{
  userId: "test-user",
  userName: "John Doe",
  userEmail: "john@example.com",
  userPhone: "555-0123",
  companionshipId: "existing-companionship-id",
  dinnerDate: new Date(),
  dayOfWeek: "Friday",
  guestCount: 2,
  status: "confirmed",
  contactPreference: "email",
  reminderSent: false,
  notes: "Looking forward to it!",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## Email Template

The confirmation email includes:
- Welcome message and confirmation
- Event details (date, missionaries, area, guest count)
- User's notes (if provided)
- Action buttons to view calendar or change/cancel signup
- Mobile-responsive HTML design

## Error Handling

- Email failures do not prevent signup creation
- Errors are logged to Firebase Functions logs
- Future: Admin notifications for email failures (planned)

## Architecture

```
Firestore signup created
    ↓
Firebase Function triggered
    ↓
Fetch companionship details
    ↓
Generate HTML/text email
    ↓
Send via Resend API
    ↓
Log success/failure
```

## Troubleshooting

### Common Issues

1. **Function not triggering**: Check Firestore rules allow document creation
2. **Email not sending**: Verify `RESEND_API_KEY` and domain configuration
3. **Build errors**: Run `npm run build` in functions directory

### Checking Logs

```bash
# View function logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --follow
```

## Production Checklist

- [ ] Valid Resend API key configured
- [ ] Domain verified in Resend
- [ ] `APP_BASE_URL` set to production URL
- [ ] Functions deployed successfully
- [ ] Test signup flow end-to-end
- [ ] Monitor function logs for errors

## Future Enhancements

- Admin notification on email failures
- Reminder emails before dinner dates
- Companionship notification emails
- Calendar (.ics) file attachments
- Email templates for different event types
