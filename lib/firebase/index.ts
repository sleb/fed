// Firebase configuration and services
export { auth, db, app as default } from './config';

// Authentication services
export * from './auth';

// Firestore services
export * from './firestore';

// Re-export Firebase types we commonly use
export type { User } from 'firebase/auth';
export type { Timestamp } from 'firebase/firestore';

