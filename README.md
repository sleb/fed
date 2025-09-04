# Missionary Dinner Management System

A web-based application to help local congregations coordinate and manage dinner schedules for missionaries. Members can sign up to provide meals, view missionary information, and administrators can manage schedules and export to Google Calendar/Sheets.

## 🎯 Project Overview

This app streamlines the process of organizing meals for missionaries by providing:

- Easy signup system for congregation members
- Missionary profile management with dietary restrictions
- Automated scheduling and notifications
- Integration with Google Calendar and Sheets
- Email notifications and reminders

## 🛠 Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI components

### Backend & Database

- **Firebase App Hosting** - Hosting and deployment
- **Firestore** - NoSQL database for storing all app data
- **Firebase Authentication** - User management and authentication
- **Cloud Functions** - Serverless functions for background tasks

### Integrations

- **Google Calendar API** - Sync dinner schedules
- **Google Sheets API** - Export schedule data
- **Gmail API / SendGrid** - Email notifications
- **Twilio** (Future) - SMS notifications

## 📁 Project Structure

```
missionary-dinner-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # Admin dashboard
│   │   ├── missionaries/
│   │   ├── schedules/
│   │   └── users/
│   ├── signup/                   # Member signup flow
│   ├── missionaries/             # Missionary profiles
│   ├── api/                      # API routes
│   │   ├── google-calendar/
│   │   ├── google-sheets/
│   │   ├── notifications/
│   │   └── webhooks/
│   └── globals.css
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   ├── forms/                   # Form components
│   ├── calendar/                # Calendar components
│   └── layout/                  # Layout components
├── lib/                         # Utility functions
│   ├── firebase/                # Firebase configuration
│   ├── google-apis/             # Google API helpers
│   ├── utils/                   # General utilities
│   └── validations/             # Form validation schemas
├── types/                       # TypeScript type definitions
├── hooks/                       # Custom React hooks
├── public/                      # Static assets
└── docs/                        # Project documentation
```

## 🗃 Database Schema (Firestore)

### Collections

**users**

```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'member' | 'admin' | 'missionary';
  createdAt: Timestamp;
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}
```

**missionaries**

```typescript
{
  id: string;
  name: string;
  companionName?: string;
  phone: string;
  email: string;
  area: string;
  allergies: string[];
  dietaryRestrictions: string[];
  preferences: string;
  active: boolean;
  createdAt: Timestamp;
}
```

**dinnerSlots**

```typescript
{
  id: string;
  date: string; // YYYY-MM-DD
  missionaryId: string;
  assignedUserId?: string;
  mealType: 'lunch' | 'dinner';
  status: 'open' | 'assigned' | 'confirmed' | 'completed';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**signups**

```typescript
{
  id: string;
  userId: string;
  slotId: string;
  signupDate: Timestamp;
  memberNotes?: string;
  confirmed: boolean;
}
```

## 🚀 Development Roadmap

### Phase 1: MVP (Weeks 1-3)

- [x] Project setup and configuration
- [ ] Firebase setup (Auth, Firestore, Hosting)
- [ ] Basic authentication (email/password)
- [ ] User role management
- [ ] Missionary profile CRUD
- [ ] Simple dinner slot creation
- [ ] Basic signup functionality
- [ ] Email notifications (basic)

### Phase 2: Core Features (Weeks 4-6)

- [ ] Calendar view for dinner slots
- [ ] Advanced admin dashboard
- [ ] Member dashboard and profile management
- [ ] Automated reminder system
- [ ] Google Calendar integration
- [ ] Mobile-responsive design
- [ ] Form validations and error handling

### Phase 3: Enhanced Features (Weeks 7-9)

- [ ] Google Sheets export functionality
- [ ] Bulk operations (create multiple slots)
- [ ] Recurring dinner patterns
- [ ] Advanced filtering and search
- [ ] Email template customization
- [ ] Waitlist functionality
- [ ] Basic analytics and reporting

### Phase 4: Polish & Advanced Features (Weeks 10-12)

- [ ] SMS notifications (Twilio)
- [ ] Progressive Web App (PWA) features
- [ ] Advanced analytics dashboard
- [ ] Automated conflict resolution
- [ ] Multi-language support
- [ ] Enhanced security features
- [ ] Performance optimizations

## 🛡 Security Considerations

- **Firestore Security Rules** - Protect missionary contact information
- **Role-based access control** - Members only see necessary information
- **Input validation** - Server-side validation for all forms
- **API key management** - Secure handling of Google API credentials
- **HTTPS enforcement** - All communications encrypted
- **Data privacy compliance** - GDPR considerations for member data

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase CLI
- Google Cloud Console account (for Calendar/Sheets APIs)

### Installation

1. Clone the repository

```bash
git clone https://github.com/sleb/missionary-dinner-app.git
cd missionary-dinner-app
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
# Add your Firebase and Google API credentials
```

4. Run the development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Firebase Setup

1. Create a new Firebase project
2. Enable Authentication, Firestore, and Hosting
3. Configure Google OAuth for Calendar/Sheets access
4. Deploy security rules

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Environment Variables

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google APIs
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALENDAR_API_KEY=
GOOGLE_SHEETS_API_KEY=

# Email Service
SENDGRID_API_KEY=
SMTP_FROM_EMAIL=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🤝 Support

For questions or support, please:

- Open an issue on GitHub
- Contact the development team
- Check the documentation in `/docs`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for missionary service coordination**
