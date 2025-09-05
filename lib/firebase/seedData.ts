import { DinnerSlot, Missionary } from '@/types';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from './config';

// Sample missionaries data
const SAMPLE_MISSIONARIES: Omit<Missionary, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Elder Smith & Elder Johnson',
    companionName: 'Elder Johnson',
    area: 'Downtown',
    address: '123 Main St, Apt 4B',
    apartmentNumber: '4B',
    phone: '(555) 123-4567',
    email: 'smith.johnson@missionary.org',
    zone: 'Central Zone',
    district: 'First District',
    dinnerPreferences: ['Italian', 'Mexican', 'Home cooking'],
    allergies: ['Nuts', 'Shellfish'],
    notes: 'Prefer dinner between 5-7 PM. Elder Smith is vegetarian.',
    isActive: true
  },
  {
    name: 'Elder Davis & Elder Wilson',
    companionName: 'Elder Wilson',
    area: 'Northside',
    address: '456 Oak Avenue, Unit 12',
    apartmentNumber: '12',
    phone: '(555) 234-5678',
    email: 'davis.wilson@missionary.org',
    zone: 'North Zone',
    district: 'Second District',
    dinnerPreferences: ['American', 'Asian', 'Healthy options'],
    allergies: [],
    notes: 'Available most evenings. Love trying new cuisines!',
    isActive: true
  },
  {
    name: 'Elder Thompson & Elder Garcia',
    companionName: 'Elder Garcia',
    area: 'Eastside',
    address: '789 Pine Street, Apt 7',
    apartmentNumber: '7',
    phone: '(555) 345-6789',
    email: 'thompson.garcia@missionary.org',
    zone: 'East Zone',
    district: 'Third District',
    dinnerPreferences: ['Mexican', 'BBQ', 'Comfort food'],
    allergies: ['Dairy'],
    notes: 'Elder Garcia speaks Spanish fluently. Prefer family-style meals.',
    isActive: true
  },
  {
    name: 'Elder Brown & Elder Taylor',
    companionName: 'Elder Taylor',
    area: 'Westside',
    address: '321 Elm Drive, #15',
    apartmentNumber: '15',
    phone: '(555) 456-7890',
    email: 'brown.taylor@missionary.org',
    zone: 'West Zone',
    district: 'Fourth District',
    dinnerPreferences: ['Pizza', 'Pasta', 'Sandwiches'],
    allergies: ['Gluten'],
    notes: 'Elder Taylor has celiac disease. Need gluten-free options.',
    isActive: true
  },
  {
    name: 'Elder Anderson & Elder Martinez',
    companionName: 'Elder Martinez',
    area: 'Southside',
    address: '654 Maple Court, Unit 3A',
    apartmentNumber: '3A',
    phone: '(555) 567-8901',
    email: 'anderson.martinez@missionary.org',
    zone: 'South Zone',
    district: 'Fifth District',
    dinnerPreferences: ['Tex-Mex', 'Burgers', 'Grilled food'],
    allergies: [],
    notes: 'Very active and have big appetites. Love outdoor activities.',
    isActive: true
  }
];

// Generate dinner slots for the next 4 weeks
const generateDinnerSlots = (missionaries: string[]): Omit<DinnerSlot, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const slots: Omit<DinnerSlot, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const today = new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'];

  // Generate slots for next 4 weeks
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (week * 7) + day + 1); // Start from tomorrow

      // Skip Sundays (day 0) for dinner appointments
      if (date.getDay() === 0) continue;

      // Each missionary gets 2-3 dinner slots per week
      missionaries.forEach((missionaryId, index) => {
        // Skip some days to make it realistic
        if ((day + index) % 3 === 0) return;

        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

        slots.push({
          missionaryId,
          date,
          dayOfWeek: daysOfWeek[date.getDay()],
          time: timeSlot,
          status: 'available',
          guestCount: 2, // Usually 2 missionaries
          notes: '',
          createdBy: 'system-seed'
        });
      });
    }
  }

  return slots;
};

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create missionaries first
    console.log('📝 Creating missionaries...');
    const missionaryIds: string[] = [];

    for (const missionary of SAMPLE_MISSIONARIES) {
      const missionaryData = {
        ...missionary,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'missionaries'), missionaryData);
      missionaryIds.push(docRef.id);
      console.log(`✅ Created missionary: ${missionary.name} (${docRef.id})`);
    }

    // Generate and create dinner slots
    console.log('📅 Creating dinner slots...');
    const dinnerSlots = generateDinnerSlots(missionaryIds);

    for (const slot of dinnerSlots) {
      const slotData = {
        ...slot,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'dinnerSlots'), slotData);
    }

    console.log(`✅ Created ${dinnerSlots.length} dinner slots`);

    // Create a sample admin user (you'll need to update this with a real user ID)
    console.log('👤 Creating sample admin user...');
    const adminUserId = 'REPLACE_WITH_YOUR_USER_ID'; // You'll need to replace this
    const adminUserData = {
      id: adminUserId,
      name: 'Administrator',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        emailNotifications: true,
        smsNotifications: true
      }
    };

    // Only create if you provide a real user ID
    if (adminUserId !== 'REPLACE_WITH_YOUR_USER_ID') {
      await setDoc(doc(db, 'users', adminUserId), adminUserData);
      console.log('✅ Created admin user');
    } else {
      console.log('⚠️  Skipped admin user creation - update adminUserId in seedData.ts');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${SAMPLE_MISSIONARIES.length} missionaries created`);
    console.log(`   - ${dinnerSlots.length} dinner slots created`);
    console.log(`   - Ready for signups!`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

export const clearTestData = async (): Promise<void> => {
  console.log('🧹 Note: Manual cleanup required');
  console.log('Please use Firebase Console or Admin SDK to clear test data');
  console.log('Collections to clear: missionaries, dinnerSlots, signups');
};
