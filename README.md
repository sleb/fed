# Missionary Dinner Coordination System

> **⚠️ PRE-ALPHA SOFTWARE** - This is early-stage development software. Features may be incomplete, breaking changes will occur without notice, and data models may change. Not recommended for production use.

A modern Next.js application for coordinating dinners between ward members and missionary companionships. Built with Firebase, TypeScript, and Tailwind CSS.

## ✨ Features

- **🔐 Firebase Authentication**: Secure login with Google OAuth
- **👥 User Onboarding**: New user setup with contact preferences and notification settings
- **👤 Role-Based Access**: Member and Admin roles with appropriate permissions
- **📅 Dynamic Calendar**: Virtual slots generated from companionship schedules
- **🍽️ Smart Dietary Management**: Comprehensive allergy and preference tracking
- **📱 Responsive Design**: Mobile-optimized with touch-friendly interfaces
- **⚡ Real-time Updates**: Live calendar synchronization across all users
- **🎯 Smart Calendar Navigation**: Multi-view calendar with mini-calendar widget
- **🔍 Advanced Filtering**: Filter by companionship with persistent preferences
- **♿ Accessibility First**: Screen reader support and keyboard navigation

## 🎯 Core Concepts

### User Onboarding Flow

New users are automatically prompted to complete their profile:

- **Contact Information**: Phone number and address (optional)
- **Notification Preferences**: Email notifications for signup confirmations
- **Notification Types**: Signup confirmations, appointment reminders, change notifications
- **Reminder Timing**: How many days before dinner to send reminders

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
- **Real-time sync** - instant availability updates across all users

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
    emailNotifications: boolean;
    signupReminders: boolean;
    appointmentReminders: boolean;
    changeNotifications: boolean;
    reminderDaysBefore: number;
  };
  stats: {
    totalSignups: number;
    completedDinners: number;
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
  status: "confirmed" | "pending" | "completed";
  contactPreference: "email";
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
2. **Onboarding** - Set contact info and email notification preferences
3. **Calendar Access** - Browse and sign up for dinner slots
4. **Profile Management** - Edit preferences anytime via dedicated profile page

### For Members

- **Multi-View Calendar**: Month, week, and day views with intuitive navigation
- **Mini Calendar Widget**: Quick navigation with availability indicators and user signups
- **Smart Filtering**: Filter by companionship with preferences saved across sessions
- **Visual Calendar**: Color-coded slots (green=available, blue=your signup, gray=taken)
- **Mobile-Optimized**: Touch-friendly interface with floating action buttons
- **Real-Time Updates**: See slot availability changes instantly without refresh
- **Streamlined Signup**: Modal displays saved contact info with link to edit profile
- **Dietary Information**: Clear display of missionary allergies and preferences
- **Profile Management**: Dedicated profile page for contact info and email notification preferences

### For Administrators

- **Mobile Admin Interface**: Touch-optimized management with floating controls
- **Responsive Data Tables**: Auto-scaling tables with touch-friendly actions
- **Confirmation Dialogs**: Safe deletion with confirmation prompts
- **Statistics Dashboard**: Compact stats display for mobile and desktop
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

## 🏗 Architecture & Design Decisions

### Real-Time Data Architecture

**Live Calendar Subscriptions**: The calendar uses Firebase's `onSnapshot` for real-time updates:

```typescript
// Automatic synchronization across all users
CalendarService.subscribeToCalendarDataForMonth(year, month, (calendarData) => {
  // Updates happen instantly across all users
  setSlots(calendarData.slots);
  setCompanionships(calendarData.companionships);
  setMissionaries(calendarData.missionaries);
});
```

**Benefits**:

- ✅ Instant availability updates when users sign up
- ✅ No manual refresh needed after mutations
- ✅ Consistent state across all connected clients
- ✅ Efficient bandwidth usage (only current month data)

### Mobile-First Design Principles

**Responsive Breakpoints**: Tailored interfaces for different screen sizes:

- **Desktop**: Full calendar grid with detailed information panels
- **Tablet**: Compressed headers with touch-optimized controls
- **Mobile**: Floating action buttons, compact layouts, simplified navigation

**Touch Interface Optimizations**:

- Larger touch targets (min 44px) for all interactive elements
- Swipe gestures for calendar navigation
- Floating action buttons positioned for thumb accessibility
- Bottom sheets for mobile modals and forms

### Accessibility Implementation

**Screen Reader Support**:

- Semantic HTML with proper ARIA labels
- Screen reader announcements for dynamic content changes
- Keyboard navigation support for all interactive elements
- Focus management in modals and dynamic interfaces

**Visual Accessibility**:

- High contrast color scheme with meaningful color coding
- Clear visual hierarchy with proper heading structure
- Loading states and error boundaries with descriptive messages

### State Management Strategy

**Local State with Real-Time Sync**:

- React state for UI interactions and form data
- Firebase subscriptions for shared application data
- Optimistic updates with rollback on conflicts
- Persistent user preferences in localStorage

**Data Flow**:

```
Firebase Firestore → Real-time Subscriptions → React State → UI Updates
```

### Component Architecture

**Separation of Concerns**:

- **Services Layer**: Firebase operations and business logic
- **Hooks Layer**: Custom hooks for auth and data management
- **Components Layer**: Pure UI components with minimal logic
- **Pages Layer**: Route-specific logic and data coordination

**Reusable Patterns**:

- Generic subscription hook for real-time data
- Consistent modal and dialog patterns
- Standardized form validation and submission
- Shared loading and error state handling

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

3. **Configure Firebase Functions Environment**

   ```bash
   # Set required environment variables for Firebase Functions
   firebase functions:config:set email.from="Your App Name <noreply@yourdomain.com>"
   firebase functions:config:set app.base_url="https://yourdomain.com"

   # For local development with emulator, create functions/.env
   cd functions
   echo "EMAIL_FROM=Your App Name <noreply@yourdomain.com>" > .env
   echo "APP_BASE_URL=https://yourdomain.com" >> .env
   ```

4. **Set up Firestore security rules**

   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Start development with emulator**

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

### Phase 1: Core Functionality ✅ COMPLETE

- [x] Authentication and authorization with Google OAuth
- [x] Complete user onboarding flow with validation
- [x] User profile management with notification preferences
- [x] Missionary and companionship management with mobile UI
- [x] Dynamic calendar with virtual slots and real-time updates
- [x] Multi-view calendar (month, week, day) with navigation widget
- [x] Smart filtering by companionship with persistent preferences
- [x] Mobile-optimized responsive design with touch interfaces
- [x] Real-time live updates across all users
- [x] Accessibility support with screen reader compatibility
- [x] Streamlined signup flow with saved user preferences
- [x] Admin dashboard with mobile-friendly data management tools
- [x] Comprehensive error handling and loading states

### Phase 2: Enhanced Features (In Progress)

- [ ] Email notification implementation (backend)
- [ ] Automated reminder system with customizable timing
- [ ] Signup modification and cancellation workflows
- [ ] Enhanced admin reporting and analytics dashboard
- [ ] Bulk member management and import tools
- [ ] Calendar export/sync with external calendar apps
- [ ] Advanced search and filtering capabilities
- [ ] Recurring dinner series support

### Phase 3: Polish & Scale (Planned)

- [ ] Complete email notification system with delivery tracking
- [ ] Advanced reporting and data export (CSV, PDF)
- [ ] Enhanced error handling and recovery mechanisms
- [ ] Performance optimization for large datasets and high concurrency
- [ ] Multi-ward/stake support with role delegation
- [ ] Offline support with data synchronization
- [ ] Production deployment guides and monitoring
- [ ] Automated testing suite and CI/CD pipeline
- [ ] User feedback and rating system
- [ ] Integration with church management systems

## 🛠 Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4
- **Backend**: Firebase (Auth + Firestore with real-time subscriptions)
- **UI Components**: Custom components with Radix UI primitives and shadcn/ui
- **Accessibility**: Radix UI primitives for keyboard navigation and screen readers
- **Real-time**: Firebase Firestore onSnapshot for live data synchronization
- **State Management**: React hooks with Firebase subscriptions
- **Development**: Firebase Emulator Suite with automated seeding
- **Deployment**: Firebase App Hosting with Next.js optimization

## 📈 Recent Progress & Achievements

### Calendar & Mobile UX Improvements

- **Real-time synchronization**: Calendar now updates instantly across all users
- **Mobile-first design**: Complete mobile optimization with touch interfaces
- **Multi-view navigation**: Month, week, and day views with mini-calendar widget
- **Smart filtering**: Companionship filtering with persistent user preferences
- **Accessibility enhancements**: Full screen reader support and keyboard navigation

### Technical Improvements

- **Live data subscriptions**: Firebase real-time listeners for instant updates
- **Type safety improvements**: Enhanced TypeScript definitions and validation
- **Error handling**: Comprehensive error boundaries and user feedback
- **Performance optimization**: Efficient data loading and subscription management
- **Code quality**: Fixed all TypeScript diagnostics and improved maintainability

### Design System Evolution

- **Consistent visual language**: Color-coded status indicators across all views
- **Responsive breakpoints**: Tailored experiences for desktop, tablet, and mobile
- **Touch-optimized controls**: Floating action buttons and gesture support
- **Loading states**: Skeleton screens and progressive data loading
- **Confirmation patterns**: Safe deletion workflows with user confirmation

## 📝 Contributing

Since this is pre-alpha software:

1. Expect breaking changes frequently
2. No formal contribution process yet
3. Focus on core functionality with mobile-first approach
4. Document architectural decisions and accessibility considerations
5. Keep dependencies minimal and maintain real-time performance
6. Test across multiple devices and screen sizes
7. Validate accessibility with screen readers

## 📄 License

MIT License - see LICENSE file for details

---

⚠️ **Remember**: This is pre-alpha software. Use at your own risk and expect significant changes.

Built with ❤️ for missionary work coordination
