# Missionary Dinner Coordination System

A modern web application built with Next.js and Firebase that streamlines dinner coordination between ward members and missionary companionships.

## 🎯 Project Overview

This system replaces manual dinner coordination with an intuitive digital solution where:

- **Ward members** can view available dinner slots and sign up to host missionaries
- **Missionary companionships** have flexible schedules based on their availability
- **Administrators** manage companionships, missionaries, and generate dinner slots
- **Everyone** benefits from clear dietary information and seamless communication

The system prioritizes user experience with role-based interfaces, comprehensive dietary information display, and streamlined signup processes.

## ✅ Current Status - **FUNCTIONAL MVP**

The system is fully functional and ready for production use with all core features implemented.

### 🔐 Authentication & User Management

- ✅ Google OAuth integration with Firebase Auth
- ✅ Role-based access control (Member, Admin)
- ✅ Automatic user document creation
- ✅ Protected routes with seamless redirects
- ✅ Development-friendly admin setup

### 👥 User Interfaces

- ✅ **Member Calendar**: Clean monthly view with available dinner slots
- ✅ **Signup Flow**: Simplified form with missionary dietary information display
- ✅ **Admin Dashboard**: Comprehensive management tools
- ✅ **Companionship Management**: Create and manage missionary companionships with flexible schedules
- ✅ **Slot Generation**: Automated dinner slot creation based on companionship availability
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile devices

### 📊 Data Management

- ✅ **Real-time Updates**: Instant UI updates when slots are booked
- ✅ **Comprehensive Dietary Info**: Allergies, preferences, and notes from missionaries
- ✅ **Flexible Scheduling**: Each companionship sets their own available days
- ✅ **Efficient Queries**: Optimized Firestore queries with proper indexing
- ✅ **Data Validation**: Form validation and error handling
- ✅ **Seeding System**: Easy database population for testing

### 🎨 User Experience

- ✅ **Intuitive Calendar Interface**: Color-coded slots (Available, Assigned, Your Signups)
- ✅ **Smart Information Display**: Shows relevant dietary information without overwhelming users
- ✅ **Clean Signup Process**: Members can't edit missionary count, focus on their own notes
- ✅ **Visual Status Indicators**: Clear visual feedback for all actions
- ✅ **Error Handling**: Graceful error messages and recovery
- ✅ **Loading States**: Smooth loading indicators throughout the app
- ✅ **Debug Tools**: Built-in debugging for development
- ✅ **Mobile Responsive**: Fully functional on all device sizes

## 🛠 Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI Components** - Accessible component library
- **Lucide Icons** - Beautiful icon library

### Backend & Database

- **Firebase Firestore** - NoSQL database with real-time updates
- **Firebase Authentication** - Google OAuth integration
- **Firebase Emulator Suite** - Local development environment

### Development Tools

- **ESLint & Prettier** - Code formatting and linting
- **Firebase CLI** - Database management and deployment
- **VS Code** - Recommended IDE with TypeScript support

## 🗃 Database Schema

### Collections

#### `users`

```typescript
{
  id: string; // Firebase Auth UID
  name: string; // Display name
  email: string; // Email address
  role: "member" | "admin";
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  }
}
```

#### `missionaries`

```typescript
{
  id: string;
  name: string;
  email?: string;
  dinnerPreferences: string[];  // ["Italian", "Vegetarian", "BBQ"]
  allergies: string[];          // ["Nuts", "Shellfish", "Dairy"]
  notes?: string;               // "Vegetarian, prefers simple meals"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `companionships`

```typescript
{
  id: string;
  area: string;                 // "Downtown", "Northside"
  address: string;
  apartmentNumber?: string;
  phone: string;                // Shared companionship phone
  missionaryIds: string[];      // References to missionaries
  daysOfWeek: number[];         // [0,1,2,3,4,5,6] - Days available for dinner
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `dinnerSlots`

```typescript
{
  id: string;
  companionshipId: string;
  date: Date;
  dayOfWeek: string;           // "Monday", "Tuesday", etc.
  status: "available" | "assigned" | "completed" | "cancelled";
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserEmail?: string;
  assignedUserPhone?: string;
  guestCount: number;          // Number of missionaries (usually 2)
  notes?: string;              // Slot-specific notes
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

#### `signups`

```typescript
{
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  dinnerSlotId: string;
  missionaryId: string;        // For compatibility
  missionaryName: string;      // Companionship display name
  dinnerDate: Date;
  guestCount: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  contactPreference: "email" | "phone" | "both";
  reminderSent: boolean;
  notes?: string;              // Member's notes for missionaries
  createdAt: Date;
  updatedAt: Date;
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
│   │   │   ├── calendar/         # Generate dinner slots
│   │   │   └── page.tsx          # Admin dashboard
│   │   └── calendar/             # Member calendar view
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components
│   └── AdminRoute.tsx            # Admin route protection
├── hooks/                        # Custom React hooks
│   └── useAuth.ts                # Authentication hook
├── lib/                          # Utility libraries
│   └── firebase/                 # Firebase integration
│       ├── auth.ts               # Authentication functions
│       ├── calendar.ts           # Calendar utilities
│       ├── config.ts             # Firebase configuration
│       ├── firestore.ts          # Database operations
│       └── seedData.ts           # Database seeding
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Main types file
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Database indexes
├── firebase.json                 # Firebase configuration
└── next.config.ts                # Next.js configuration
```

## 🧭 Navigation & User Experience

### **Modern Navigation System**

- **Role-based routing** - Users automatically see appropriate interfaces
- **Protected routes** - Authentication and authorization handled automatically
- **Seamless redirects** - Users always land where they should be
- **Responsive design** - Clean interface across all devices

### **User Experience Flow**

**For Members:**

1. Sign in with Google → Automatically redirected to calendar
2. Browse available dinner slots in clean monthly view
3. Click on green (available) slots to see signup form
4. View comprehensive missionary dietary information (allergies, preferences, notes)
5. Add personal phone and notes, then sign up
6. See slot turn blue to indicate successful signup

**For Admins:**

1. Sign in → Access admin dashboard with setup tools
2. Create companionships with flexible day-of-week schedules
3. Manage individual missionaries with dietary preferences
4. Generate dinner slots automatically or for specific companionships
5. Monitor signups and manage the system

## 🔒 Security & Design Decisions

### Route Protection Architecture

- **Public Routes**: Landing page and login only
- **Protected Routes**: All functionality requires authentication
- **Admin Routes**: Administrative functions require admin role
- **Role Assignment**: Self-service admin promotion for development
- **Data Isolation**: Users can only modify their own signups

### Authentication Strategy

- **Google OAuth Only**: Simplified, secure authentication
- **Automatic User Creation**: User documents created on first login
- **Role-Based Access**: Flexible permission system
- **Session Management**: Firebase handles all session complexity

### Data Access Control

- **Firestore Security Rules**: Comprehensive data protection
- **User Data Isolation**: Users can only access/modify their own data
- **Admin Oversight**: Admins can read all data but users control their signups
- **Real-time Updates**: Optimistic UI with real-time data sync

### User Experience Principles

- **Simplified Signup**: Members focus on their role, not system complexity
- **Clear Information Hierarchy**: Important info (allergies) prominently displayed
- **No Data Confusion**: Missionaries provide dietary info, members add logistics notes
- **Visual Feedback**: Color-coded slots, loading states, and clear error messages

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- Google account for Firebase project

### Installation

1. **Clone the repository**

```bash
git clone [repository-url]
cd fed
npm install
```

2. **Set up Firebase project**

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Firestore
# - Authentication
# - Emulators (Firestore, Authentication)
```

3. **Configure environment**

```bash
# Create .env.local with your Firebase config
cp .env.example .env.local
# Add your Firebase configuration variables
```

4. **Start development servers**

```bash
# Terminal 1: Start Firebase Emulators
npm run emulator

# Terminal 2: Start Next.js dev server
npm run dev
```

5. **Initialize the system**

- Open http://localhost:3000
- Sign in with Google
- Go to `/admin` and click "Make Me Admin"
- Click "Seed Test Data" to populate the database
- Go to `/calendar` to see the dinner slots

### Firebase Configuration

Add these variables to your `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 📋 Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run emulator` - Start Firebase emulator suite
- `npm run deploy` - Deploy to Firebase hosting (when configured)

## 🎯 Features & Capabilities

### For Ward Members

- **Monthly Calendar View**: Clean interface showing all available dinner opportunities
- **Smart Signup Process**: Can't accidentally change missionary count, focuses on member input
- **Comprehensive Dietary Info**: See allergies, preferences, and special notes from missionaries
- **Easy Management**: View and modify your own signups
- **Mobile Friendly**: Works perfectly on phones and tablets

### For Administrators

- **Companionship Management**: Create companionships with custom schedules (any days of the week)
- **Missionary Profiles**: Manage dietary preferences, allergies, and notes
- **Flexible Slot Generation**: Create dinner slots automatically or for specific time periods
- **Bulk Operations**: Generate slots for all companionships at once
- **Data Oversight**: Monitor signups and system usage

### For Missionaries

- **Profile Management**: Set dietary preferences, allergies, and helpful notes
- **Flexible Scheduling**: Companionships can be available any combination of days
- **Automatic Information Sharing**: Dietary info automatically shown to potential hosts

## 🚀 Deployment

The system is ready for production deployment:

1. **Production Firebase Project**

```bash
firebase use --add production
firebase deploy
```

2. **Environment Configuration**

- Update `.env.local` with production Firebase config
- Configure custom domain if desired

3. **Initial Setup**

- Designate admin users
- Create real companionships and missionaries
- Generate initial dinner slots

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for missionary work and ward coordination**
