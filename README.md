# Missionary Dinner Coordination System

A modern Next.js application for coordinating dinners between ward members and missionary companionships. Built with Firebase, TypeScript, and Tailwind CSS.

## ✨ Features

- **🔐 Firebase Authentication**: Secure login with role-based access control
- **👥 User Roles**: Admin, Missionary, and Member with appropriate permissions
- **📅 Dynamic Calendar**: Virtual slots generated from companionship schedules
- **🍽️ Smart Dietary Management**: Comprehensive allergy and preference tracking
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **⚡ Real-time Updates**: Instant signup reflection across all users

## 🎯 Core Concepts

### User Roles

- **Members**: Sign up for dinner slots, view missionary dietary information
- **Missionaries**: Maintain dietary preferences and contact information
- **Admins**: Manage missionaries, companionships, and monitor signups

### Companionship Schedules

Each companionship has:

- **Available Days**: Which days of the week they're available for dinner
- **Missionary Assignment**: Active missionaries in the companionship
- **Contact Information**: Area, phone number, and notes

### Dynamic Slot System

Instead of pre-creating empty slots in the database, the system:

- **Generates virtual slots** on-the-fly based on companionship schedules
- **Shows availability** without database bloat
- **Creates records** only when someone actually signs up
- **Eliminates maintenance** - no need for admins to generate slots monthly

## 🏗 Data Model

### Core Collections

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
  zone?: string;
  district?: string;
  phone?: string;
  missionaryIds: string[];
  daysOfWeek: number[];          // 0=Sunday, 1=Monday, etc.
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
  notes?: string;                // Member's notes for missionaries
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
│   └── firebase/                 # Firebase configuration and services
│       ├── auth.ts               # Authentication logic
│       ├── calendar.ts           # Dynamic slot generation
│       ├── config.ts             # Firebase config
│       ├── firestore.ts          # Database operations
│       └── seedData.ts           # Development data seeding
├── types/                        # TypeScript type definitions
│   └── index.ts                  # All application types
└── README.md                     # This file
```

## 🎨 User Experience Highlights

### For Members

- **Visual Calendar**: Color-coded slots (Available, Taken, Your Signups)
- **Dietary Information**: Clear display of missionary allergies and preferences
- **Simple Signup**: Phone, contact preference, and optional notes
- **Easy Management**: Modify or cancel signups with one click

### For Administrators

- **Zero Maintenance**: No slot generation needed
- **Real-time Monitoring**: Dashboard shows upcoming signups
- **Companionship Management**: Set schedules and missionary assignments
- **Contact Overview**: Quick access to member and missionary information

### Design Principles

- **Information Hierarchy**: Members see dietary info but can't edit it
- **Clear Responsibilities**: Members provide contact info and logistics notes
- **Visual Feedback**: Color-coded slots, loading states, and clear error messages
- **Mobile-First**: Responsive design works on all devices

## 🔄 System Architecture Benefits

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

**Result**: Clean architecture with zero maintenance overhead for slot management.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with:
  - Authentication enabled
  - Firestore database
  - Hosting (optional)

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
   # ... other config values
   ```

3. **Set up Firestore security rules**

   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Seed development data**
   ```bash
   npm run dev
   # Navigate to /admin and run the database seeding function
   ```

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

## 🔒 Security

### Firestore Rules

- Members can read/write their own signups
- All users can read missionaries and companionships
- Only admins can write missionaries and companionships
- Authentication required for all operations

### Route Protection

- `/admin/*` routes require admin role
- All protected routes require authentication
- Client-side and server-side role validation

## 🎯 Development Roadmap

### Phase 1: Core Functionality ✅

- [x] Authentication and authorization
- [x] Missionary and companionship management
- [x] Dynamic calendar with virtual slots
- [x] Signup creation and management
- [x] Admin dashboard

### Phase 2: Enhanced Features

- [ ] Email notifications for signups
- [ ] SMS reminders (optional)
- [ ] Recurring dinner preferences
- [ ] Calendar export functionality
- [ ] Missionary feedback system

### Phase 3: Scaling

- [ ] Multi-ward support
- [ ] Advanced reporting
- [ ] Mobile app (React Native)
- [ ] Integration with ward systems

## 🛠 Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **UI Components**: Custom components with shadcn/ui
- **State Management**: React hooks and context
- **Deployment**: Vercel or Firebase Hosting

## 📝 Contributing

1. Follow TypeScript best practices
2. Use conventional commits
3. Add tests for new features
4. Update documentation as needed

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ for missionary work coordination
