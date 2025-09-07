# Missionary Dinner Coordination System

> **⚠️ PRE-ALPHA SOFTWARE** - This is early-stage development software. Features may be incomplete, breaking changes will occur without notice, and data models may change. Not recommended for production use.

A modern Next.js application for coordinating dinners between ward members and missionary companionships. Built with Firebase, TypeScript, and Tailwind CSS.

## ✨ Features

- **🔐 Firebase Authentication**: Secure login with Google OAuth
- **👥 User Onboarding**: New user setup with contact preferences and notification settings
- **👤 Role-Based Access**: Member and Admin roles with appropriate permissions
- **📅 Dynamic Calendar**: Virtual slots generated from companionship schedules
- **🍽️ Smart Dietary Management**: Comprehensive allergy and preference tracking
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **⚡ Real-time Updates**: Instant signup reflection across all users

## 🎯 Core Concepts

### User Onboarding Flow

New users are automatically prompted to complete their profile:

- **Contact Information**: Phone number and address (optional)
- **Notification Preferences**: Email, SMS, or both
- **Notification Types**: Signup reminders, appointment reminders, change notifications
- **Reminder Timing**: How many days before dinner to send reminders
- **Contact Method Validation**: Ensures phone number is provided if SMS notifications are selected

### User Roles

- **Members**: Sign up for dinner slots, manage their profile and notification preferences
- **Admins**: Manage missionaries, companionships, monitor all signups, and access admin dashboard

### Companionship Schedules

Each companionship has:

- **Available Days**: Which days of the week they're available for dinner
- **Missionary Assignment**: Active missionaries in the companionship
- **Contact Information**: Area, phone number, and notes

### Dynamic Slot System

No pre-created database records for empty slots:

- **Generates virtual slots** on-the-fly based on companionship schedules
- **Shows availability** without database bloat
- **Creates records** only when someone actually signs up
- **Zero maintenance** - no admin slot generation needed

## 🏗 Data Model

### Core Collections

#### `users`

```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: "member" | "admin";
  onboardingCompleted: boolean;
  preferences: {
    contactMethod: "email" | "sms" | "both";
    signupReminders: boolean;
    appointmentReminders: boolean;
    changeNotifications: boolean;
    reminderDaysBefore: number;
  };
  stats: {
    totalSignups: number;
    completedDinners: number;
    cancelledDinners: number;
    lastDinnerDate?: Date;
  };
  createdAt: Date;
  lastLoginAt: Date;
}
```

#### `missionaries`

```typescript
{
  id: string;
  name: string;
  email?: string;
  dinnerPreferences?: string[];
  allergies?: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `companionships`

```typescript
{
  id: string;
  area: string;
  address: string;
  apartmentNumber?: string;
  phone: string;
  missionaryIds: string[];
  daysOfWeek: number[];          // 0=Sunday, 1=Monday, etc.
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `signups`

Contains all slot information directly embedded:

```typescript
{
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  // Embedded slot information
  companionshipId: string;
  dinnerDate: Date;
  dayOfWeek: string;
  guestCount: number;            // Number of missionaries eating
  status: "confirmed" | "pending" | "cancelled" | "completed";
  contactPreference: "email" | "phone" | "both";
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Virtual Data Structures

#### Dynamic Slots (Not Stored)

```typescript
// Generated on-the-fly for calendar display
interface VirtualDinnerSlot {
  companionshipId: string;
  date: Date;
  dayOfWeek: string;
  guestCount: number;
  status: "available" | "taken";
  signup?: Signup; // If someone has signed up
}
```

## 🏗 Project Structure

```
fed/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   └── login/
│   ├── (protected)/              # Protected routes requiring auth
│   │   ├── admin/                # Admin-only pages
│   │   │   ├── companionships/   # Manage companionships
│   │   │   ├── missionaries/     # Manage missionaries
│   │   │   └── page.tsx          # Admin dashboard
│   │   ├── calendar/             # Member calendar view
│   │   ├── onboarding/           # New user setup flow
│   │   └── profile/              # User profile and preferences
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable UI components
│   ├── auth/                     # Authentication components
│   ├── onboarding/               # User onboarding flow
│   └── ui/                       # Base UI components
├── hooks/                        # Custom React hooks
│   └── useAuth.ts                # Authentication hook
├── lib/                          # Utility libraries
│   └── firebase/                 # Firebase configuration and services
│       ├── auth.ts               # Authentication logic
│       ├── calendar.ts           # Dynamic slot generation
│       ├── config.ts             # Firebase config
│       ├── firestore.ts          # Database operations
│       └── seedData.ts           # Development data seeding
├── scripts/                      # Utility scripts
│   ├── debugEmulator.js          # Debug emulator database
│   └── seedEmulator.js           # Seed test data
├── types/                        # TypeScript type definitions
│   └── index.ts                  # All application types
└── README.md                     # This file
```

## 🎨 User Experience

### New User Flow

1. **Sign in with Google** - Automatic account creation
2. **Onboarding** - Set contact info and notification preferences with validation
3. **Calendar Access** - Browse and sign up for dinner slots
4. **Profile Management** - Edit preferences anytime via dedicated profile page

### For Members

- **Visual Calendar**: Color-coded slots (Available, Taken, Your Signups)
- **Streamlined Signup**: Modal displays saved contact info with link to edit profile
- **Dietary Information**: Clear display of missionary allergies and preferences
- **Profile Management**: Dedicated profile page for contact info and notification preferences
- **Smart Validation**: Contact method validation (phone required for SMS notifications)

### For Administrators

- **Zero Maintenance**: No slot generation needed - dynamic slots from companionship schedules
- **Real-time Monitoring**: Dashboard shows upcoming signups and member activity
- **User Management**: View member profiles, contact preferences, and signup statistics
- **Data Management**: Development tools for seeding test data and debugging

## 🔄 System Architecture Benefits

### No Migration Needed

```
✅ Clean slate - no backward compatibility cruft
✅ Modern data structures from day one
✅ No legacy migration scripts
✅ Pre-alpha freedom to iterate quickly
```

### Dynamic Virtual Slots

```
✅ Zero database records for empty slots
✅ Automatic availability based on companionship schedules
✅ No administrative overhead
✅ Real-time adaptation to schedule changes
```

### Embedded Data Model

```
✅ All slot information stored with signup
✅ No complex relational queries needed
✅ Simplified data relationships
✅ Better performance and scalability
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Authentication and Firestore enabled
- Firebase CLI installed globally

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <repository>
   cd fed
   npm install
   ```

2. **Configure Firebase**

   ```bash
   # Create .env.local with your Firebase config
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Set up Firestore security rules**

   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Start development with emulator**

   ```bash
   # Start Firebase emulators
   firebase emulators:start

   # In another terminal, seed test data
   node scripts/seedEmulator.js seed

   # Start Next.js development server
   npm run dev
   ```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Emulator utilities
node scripts/debugEmulator.js inspect    # Inspect database
node scripts/debugEmulator.js clear      # Clear all data
node scripts/seedEmulator.js seed        # Seed test data
```

## 🔒 Security

### Firestore Rules

- Users can read/write their own data and signups
- All authenticated users can read missionaries and companionships
- Only admins can write missionaries and companionships
- Onboarding page accessible to incomplete profiles

### Route Protection

- `/admin/*` routes require admin role
- `/onboarding` requires authentication but bypasses completion check
- All other protected routes require completed onboarding
- Client-side and server-side validation

## ⚠️ Pre-Alpha Limitations

- **Breaking Changes**: Data models may change without migration paths
- **Missing Features**: Many planned features are not yet implemented
- **Limited Testing**: Minimal test coverage, bugs expected
- **Data Loss Risk**: Database schemas may be reset during development
- **No Production Support**: Not suitable for production deployment

## 🎯 Development Roadmap

### Phase 1: Core Functionality (Current)

- [x] Authentication and authorization with Google OAuth
- [x] Complete user onboarding flow with validation
- [x] User profile management with notification preferences
- [x] Missionary and companionship management
- [x] Dynamic calendar with virtual slots
- [x] Streamlined signup flow with saved user preferences
- [x] Admin dashboard with data management tools

### Phase 2: Enhanced Features

- [ ] Email/SMS notification implementation (backend)
- [ ] Automated reminder system
- [ ] Signup modification and cancellation
- [ ] Enhanced admin reporting and analytics
- [ ] Bulk member management tools

### Phase 3: Polish & Scale

- [ ] Complete notification delivery system
- [ ] Advanced reporting and data export
- [ ] Error handling and recovery mechanisms
- [ ] Performance optimization for large datasets
- [ ] Multi-ward/stake support
- [ ] Production deployment guides

## 🛠 Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4
- **Backend**: Firebase (Auth + Firestore)
- **UI Components**: Custom components with Radix UI primitives
- **Development**: Firebase Emulator Suite
- **Deployment**: Firebase App Hosting

## 📝 Contributing

Since this is pre-alpha software:

1. Expect breaking changes frequently
2. No formal contribution process yet
3. Focus on core functionality over polish
4. Document architectural decisions
5. Keep dependencies minimal

## 📄 License

MIT License - see LICENSE file for details

---

⚠️ **Remember**: This is pre-alpha software. Use at your own risk and expect significant changes.

Built with ❤️ for missionary work coordination
