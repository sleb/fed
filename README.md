# Missionary Dinner Coordination System

A modern web application to help local congregations coordinate and manage dinner schedules for missionaries. Built with Next.js, Firebase, and Tailwind CSS for a seamless user experience.

## 🎯 Project Overview

This application streamlines the process of organizing meals for missionaries by providing:

- **Easy signup system** for congregation members to volunteer for dinner slots
- **Companionship-based organization** - meals are scheduled for missionary companionships (2-3 missionaries serving together in an area)
- **Individual missionary profiles** with personal contact info, dietary restrictions and preferences
- **Smart companionship management** with validation and status tracking
- **Real-time availability tracking** with automatic slot assignment
- **Role-based access control** for members and administrators
- **Mobile-first responsive design** for accessibility on all devices

## ✅ Current Status - **FUNCTIONAL MVP**

The core application is **fully operational** with the following completed features:

### 🔐 Authentication & User Management

- **Google OAuth integration** for secure, passwordless authentication
- **Role-based access control** (Member, Admin, Missionary roles)
- **Automatic user document creation** with preferences
- **Secure redirect flows** based on user permissions

### 👥 User Interfaces

- **Member Calendar** (`/calendar`) - Visual calendar interface for viewing and signing up for dinner slots
- **Admin Dashboard** (`/admin`) - Database management and central navigation hub
- **Missionary Management** (`/admin/missionaries`) - Create and manage individual missionary records
- **Companionship Management** (`/admin/companionships`) - Manage missionary companionships with status validation
- **Calendar Management** (`/admin/calendar`) - Create and manage dinner calendars and schedules
- **Login Flow** (`/login`) - Google authentication with role-based redirects

### 📊 Data Management

- **Calendar-based scheduling** - visual month-by-month dinner coordination system
- **Companionship-focused organization** - one dinner slot per day per companionship (simplified scheduling)
- **Individual missionary profiles** with personal contact info, dietary restrictions, and preferences
- **Full missionary CRUD operations** - create, edit, and manage missionary records through admin interface
- **Smart missionary assignment** - visual interface for adding/removing missionaries from companionships
- **Companionship validation** - visual warnings for incomplete companionships needing more members
- **Aggregated allergy tracking** - automatically combines individual allergies for companionship dinner planning
- **Calendar template system** - reusable schedule patterns for different companionships
- **Auto-generated dinner slots** - bulk slot creation based on calendar schedules
- **Real-time calendar updates** with visual availability indicators

### 🎨 User Experience

- **Intuitive calendar interface** - familiar month-view layout for easy navigation
- **Color-coded availability** - visual indicators for available, taken, and user's own signups
- **One-click signup** - simple interaction model for dinner slot booking
- **Professional church-appropriate design** with shadcn/ui components
- **Tailwind CSS v4** for modern styling and responsive layouts
- **Loading states and error handling** throughout the application
- **Search and filter functionality** for missionary selection and management

## 🛠 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router and Turbopack
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **shadcn/ui** - High-quality, accessible UI components
- **Lucide React** - Beautiful, consistent icons

### Backend & Database

- **Firebase v12** - Complete backend-as-a-service solution
  - **Firestore** - NoSQL database with real-time synchronization
  - **Firebase Authentication** - Google OAuth integration
  - **Security Rules** - Server-side access control and data protection
  - **Firebase Emulator Suite** - Local development environment

### Development Tools

- **ESLint** - Code linting and quality enforcement
- **TypeScript** - Static type checking
- **Firebase CLI** - Deployment and emulator management

## 🗃 Database Schema

### Collections

> **Note**: The database uses a companionship-based model where missionaries are grouped by service area (2-3 per companionship). Companionship display names are auto-generated from assigned missionary names (e.g., "Elder Smith & Elder Johnson"). Each companionship has one shared phone number, while individual missionaries have their own email addresses.

**users**

```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'member' | 'admin' | 'missionary';
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
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
  email?: string; // Individual email addresses
  dinnerPreferences?: string[];
  allergies?: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**companionships**

```typescript
{
  id: string;
  area: string; // Primary identifier - service area
  address: string;
  apartmentNumber?: string;
  phone: string; // Shared phone number for the companionship
  missionaryIds: string[]; // Array of missionary IDs (2-3 missionaries)
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**dinnerSlots**
**dinnerSlots**

```typescript
{
  id: string;
  companionshipId: string; // References companionship directly
  date: Date;
  dayOfWeek: string;
  status: 'available' | 'assigned' | 'completed' | 'cancelled';
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserEmail?: string;
  assignedUserPhone?: string;
  specialRequests?: string;
  guestCount: number; // Number of missionaries in companionship (usually 2)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**calendarTemplates**

```typescript
{
  id: string;
  name: string;
  description?: string;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc. [1,2,3,4,5,6] = Mon-Sat
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**companionshipCalendars**

```typescript
{
  id: string;
  companionshipId: string;
  name: string;
  description?: string;
  daysOfWeek: number[]; // Days when dinner slots are available
  startDate: Date;
  endDate?: Date; // Optional: null means ongoing
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**signups**

```typescript
{
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  dinnerSlotId: string;
  missionaryId: string;
  missionaryName: string; // Auto-generated companionship display name
  dinnerDate: Date;
  guestCount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  specialRequests?: string;
  contactPreference: 'email' | 'phone' | 'both';
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🏗 Project Structure

```
fed/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication route group
│   │   └── login/                # Google OAuth login page
│   ├── admin/                    # Admin dashboard and tools
│   ├── calendar/                 # Member calendar and signup interface
│   ├── globals.css               # Global styles and Tailwind config
│   └── layout.tsx               # Root layout with fonts and metadata
├── components/                   # Reusable React components
│   └── ui/                      # shadcn/ui component library
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       └── badge.tsx
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication state management
│   └── useSignups.ts           # Signup and slot management
├── lib/                        # Utility functions and configurations
│   ├── firebase/               # Firebase setup and utilities
│   │   ├── config.ts          # Firebase initialization
│   │   ├── auth.ts            # Authentication helpers
│   │   ├── signups.ts         # Database operations for signups
│   │   └── seedData.ts        # Test data generation
│   └── utils.ts               # General utility functions
├── types/                      # TypeScript type definitions
│   └── index.ts               # Core application types
├── firebase.json              # Firebase project configuration
├── firestore.rules           # Firestore security rules
└── postcss.config.js         # PostCSS configuration for Tailwind v4
```

## 🔒 Security & Design Decisions

### Authentication Strategy

**Decision: Google OAuth Only (No Email/Password)**

**Rationale:**

- **Simplified UX** - No password management for users
- **Enhanced Security** - Leverage Google's robust authentication
- **Reduced Complexity** - No password reset flows or email verification
- **Church Context** - Most members already have Google accounts
- **Mobile Friendly** - Seamless experience across devices

### Data Access Control

- **Firestore Security Rules** enforce server-side access control
- **Role-based permissions** prevent unauthorized access to admin features
- **Users can only manage their own signups** and view necessary missionary info
- **Client-side role checks for UX**, server-side enforcement via Firebase rules

### User Experience Principles

- **Mobile-first design** for accessibility in all environments
- **Progressive enhancement** with loading states and error handling
- **Real-time updates** to prevent double-booking and conflicts
- **Intuitive navigation** with clear role-based interfaces

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Authentication and Firestore enabled

### Installation

1. **Clone and install dependencies**

```bash
git clone <repository-url>
cd fed
npm install
```

2. **Set up Firebase**

```bash
# Login to Firebase
firebase login

# Initialize Firebase (select existing project)
firebase use --add

# Start emulators for local development
firebase emulators:start
```

3. **Configure environment variables**

For local development with emulators, create a single dummy secret:

1. **Get your Firebase configuration** from Firebase Console → Project Settings → General → Your apps

2. **Create the dummy secret** for development:

```bash
firebase apphosting:secrets:set APPHOSTING_DUMMY_SECRET
```

When prompted, enter any placeholder value (e.g., "dummy-dev-config"). The actual Firebase configuration values don't matter for local development since the emulators will handle authentication and database operations.

3. **Grant access to the secret**:

```bash
firebase apphosting:secrets:grantaccess APPHOSTING_DUMMY_SECRET
```

The `apphosting.emulator.yaml` is configured to use this single dummy secret for all environment variables. This approach keeps the development setup simple while maintaining the same structure as production.

4. **Start development with emulators**

```bash
firebase emulators:start
```

This will start both Firebase emulators AND the Next.js development server.

5. **Seed test data** (optional)

- Visit `http://localhost:3000/admin` as an admin user
- Click "Seed Test Data" to populate with sample missionaries and dinner slots

### Firebase Configuration

**Required Firebase services:**

- **Authentication** with Google OAuth provider enabled
- **Firestore Database** with security rules deployed
- **Firebase Emulator Suite** for local development

**Environment Configuration:**

This project uses different environment configurations for local vs production:

- **Local Development**: Uses `apphosting.emulator.yaml` with a single `APPHOSTING_DUMMY_SECRET` for all environment variables (actual values don't matter since emulators handle everything)
- **Production**: Uses `apphosting.yaml` with individual Google Cloud Secret Manager secrets for each Firebase configuration value

**For Production Deployment:**

Create individual secrets for each Firebase configuration value:

```bash
firebase apphosting:secrets:set GOOGLE_CLIENT_ID
firebase apphosting:secrets:set FIREBASE_API_KEY
firebase apphosting:secrets:set FIREBASE_AUTH_DOMAIN
firebase apphosting:secrets:set FIREBASE_PROJECT_ID
firebase apphosting:secrets:set FIREBASE_STORAGE_BUCKET
firebase apphosting:secrets:set FIREBASE_MESSAGING_SENDER_ID
firebase apphosting:secrets:set FIREBASE_APP_ID
```

Each secret should contain only the corresponding value (not JSON). The `apphosting.yaml` file references these individual secrets for production security.

**Firestore Security Rules:**
The application includes comprehensive security rules that:

- Allow users to read/write their own data
- Restrict admin operations to admin users only
- Prevent unauthorized access to missionary contact information
- Enable users to manage their own signups while protecting others' data

## 📋 Available Scripts

```bash
# Development
firebase emulators:start    # Start Firebase emulators + Next.js dev server
npm run build              # Build production application
npm run start              # Start production server
npm run lint               # Run ESLint

# Firebase
firebase deploy                           # Deploy to Firebase App Hosting
firebase deploy --only firestore:rules   # Deploy security rules only
firebase apphosting:secrets:set SECRET_NAME  # Manage production secrets
```

## 🎯 Next Steps & Roadmap

### Phase 2: Enhanced Features (Completed ✅)

- [x] **Missionary Management Interface** - Full CRUD operations for missionary profiles
  - ✅ Dedicated `/admin/missionaries` page for individual missionary management
  - ✅ Admin interface for creating and editing missionary records
  - ✅ Smart filtering (active/inactive/assigned/unassigned missionaries)
  - ✅ Advanced search by name, email, allergies, and preferences
  - ✅ Individual allergy and preference management with add/remove interface
  - ✅ Assignment status tracking and companionship association display
  - ✅ Mobile-friendly modal forms with comprehensive validation
  - ✅ Statistics dashboard showing missionary distribution

- [x] **Companionship Management Interface** - Advanced companionship operations
  - ✅ Dedicated `/admin/companionships` page focused on companionship coordination
  - ✅ Smart missionary-companionship assignment with visual interface
  - ✅ Real-time filtering of available/assigned missionaries within companionship forms
  - ✅ Action-needed-only badge system (hides badges for properly functioning companionships)
  - ✅ Simplified companionship display names (missionary names only, area shown separately)
  - ✅ Comprehensive companionship CRUD with address, phone, and notes management
  - [ ] Soft delete with restore functionality (future enhancement)
  - [ ] Area-based organization and autocomplete (future enhancement)

- [x] **Calendar System** - Visual dinner coordination interface
  - ✅ Member calendar view (`/calendar`) with month navigation and visual slot indicators
  - ✅ Admin calendar management (`/admin/calendar`) for templates and companionship schedules
  - ✅ Calendar template system for reusable schedule patterns
  - ✅ Simplified scheduling model (one slot per day per companionship)
  - ✅ Auto-generation of dinner slots based on calendar schedules
  - ✅ Color-coded availability (available, taken, user signups)
  - ✅ One-click signup and modification system
  - ✅ Bulk calendar setup for all companionships
- [ ] **Enhanced Calendar Features** - Advanced scheduling capabilities
  - **Recurring patterns** - Set up repeating dinner schedules beyond basic day-of-week
  - **Member feeding history** - Track which families have fed which companionships
  - **Blackout dates** - Ability to skip holidays and special events
  - **Custom time slots** - Option to add specific times for companionships that need them
- [ ] **Calendar integration** - Google Calendar sync for dinner schedules
- [ ] **Email notifications** - Automated reminders and confirmations
- [ ] **Enhanced filtering** - Search by missionary name, dietary restrictions
- [ ] **Mobile app** - Progressive Web App (PWA) features

### Phase 3: Advanced Features (Future)

- [ ] **Advanced Admin Tools** - Bulk operations, reporting, analytics dashboard
- [ ] **Area Admin Permissions** - Role-based access for different administrative levels
- [ ] **CSV Import/Export** - Bulk missionary data management
- [ ] **Missionary Photos** - Profile pictures and visual identification
- [ ] **Auto-deletion of Inactive Missionaries** - Automatically delete inactive missionaries after 30 days
  - Show "Will be deleted in X days" countdown badges on inactive missionaries
  - Email warnings to admins before deletion
  - Option to extend or restore before deletion deadline
- [ ] **SMS notifications** via Twilio integration
- [ ] **Multi-language support** for diverse congregations
- [ ] **Advanced analytics** - Signup patterns, member engagement metrics
- [ ] **Export functionality** - Google Sheets integration for scheduling data
- [ ] **Waitlist management** - Handle oversubscribed dinner slots
- [ ] **Member participation tracking** - Analytics on dinner hosting patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Test with Firebase emulators
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for missionary service coordination**

> _"And behold, I tell you these things that ye may learn wisdom; that ye may learn that when ye are in the service of your fellow beings ye are only in the service of your God."_ - Mosiah 2:17
