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

- **Member Signup Page** (`/signup`) - Browse and sign up for dinner slots
- **Admin Dashboard** (`/admin`) - Database management and seeding tools
- **Companionship Management** (`/admin/missionaries`) - Manage missionary companionships with status validation
- **Login Flow** (`/login`) - Google authentication with role-based redirects

### 📊 Data Management

- **Companionship-based organization** - missionaries grouped by service area (2-3 per companionship)
- **Individual missionary profiles** with personal contact info, dietary restrictions, and preferences
- **Companionship validation** - visual warnings for incomplete companionships needing more members
- **Aggregated allergy tracking** - automatically combines individual allergies for companionship dinner planning
- **Real-time dinner slot availability** with automatic updates
- **Signup tracking** with contact preferences and special requests
- **Automatic slot assignment/release** when members sign up or cancel

### 🎨 User Experience

- **Professional church-appropriate design** with shadcn/ui components
- **Tailwind CSS v4** for modern styling and responsive layouts
- **Loading states and error handling** throughout the application
- **Intuitive filtering** by date range, area, and availability

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

> **Note**: The database uses a companionship-based model where missionaries are grouped by service area (2-3 per companionship). Companionship display names are auto-generated from assigned missionaries. Each companionship has one shared phone number, while individual missionaries have their own email addresses.

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
  phone?: string; // Individual missionaries may have personal phones
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
  area: string; // Primary identifier - service area (display name auto-generated from assigned missionaries)
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

```typescript
{
  id: string;
  missionaryId: string; // References companionship ID (naming kept for compatibility)
  date: Date;
  dayOfWeek: string;
  time: string; // e.g., "6:00 PM"
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
  dinnerTime: string;
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
│   ├── signup/                   # Member signup interface
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

3. **Configure environment**

```bash
# Copy Firebase config to your project
# Update lib/firebase/config.ts with your project details
```

4. **Run development server**

```bash
npm run dev
```

5. **Seed test data** (optional)

- Visit `http://localhost:3000/admin` as an admin user
- Click "Seed Test Data" to populate with sample missionaries and dinner slots

### Firebase Configuration

**Required Firebase services:**

- **Authentication** with Google OAuth provider enabled
- **Firestore Database** with security rules deployed
- **Firebase Emulator Suite** for local development

**Firestore Security Rules:**
The application includes comprehensive security rules that:

- Allow users to read/write their own data
- Restrict admin operations to admin users only
- Prevent unauthorized access to missionary contact information
- Enable users to manage their own signups while protecting others' data

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build production application
npm run start        # Start production server
npm run lint         # Run ESLint

# Firebase
firebase emulators:start    # Start Firebase emulators
firebase deploy            # Deploy to Firebase Hosting
firebase deploy --only firestore:rules  # Deploy security rules only
```

## 🎯 Next Steps & Roadmap

### Phase 2: Enhanced Features (Upcoming)

- [ ] **Missionary Management Interface** - Full CRUD operations for missionary profiles
  - Admin interface for managing missionary records
  - Soft delete with restore functionality
  - Area-based organization and autocomplete
  - Mobile-friendly modal forms
- [ ] **Companionship-Based Calendar System** - Enhanced scheduling approach
  - **Ward-level default calendar** - Set congregation-wide dinner schedule (e.g., "Monday-Friday 6:00 PM")
  - **Companionship = Area** - Missionaries serving in the same area form a companionship
  - **Companionship overrides** - Customize schedules for specific companionships when needed
  - **Member feeding history** - Track which families have fed which companionships
  - **Automatic slot generation** - Create dinner slots based on ward calendar and active companionships
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
