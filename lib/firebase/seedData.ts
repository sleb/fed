import { Companionship, DinnerSlot, Missionary } from "@/types";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { db } from "./config";

// Sample individual missionaries
const SAMPLE_MISSIONARIES: Omit<
  Missionary,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Elder Smith",
    email: "elder.smith@missionary.org",
    dinnerPreferences: ["Italian", "Vegetarian"],
    allergies: ["Nuts"],
    notes: "Vegetarian, prefers simple meals",
    isActive: true,
  },
  {
    name: "Elder Johnson",
    email: "elder.johnson@missionary.org",
    dinnerPreferences: ["Mexican", "Home cooking"],
    allergies: ["Shellfish"],
    notes: "Loves spicy food",
    isActive: true,
  },
  {
    name: "Elder Davis",
    email: "elder.davis@missionary.org",
    dinnerPreferences: ["American", "Asian"],
    allergies: [],
    notes: "Easy going with food",
    isActive: true,
  },
  {
    name: "Elder Wilson",
    email: "elder.wilson@missionary.org",
    dinnerPreferences: ["Healthy options", "Grilled food"],
    allergies: [],
    notes: "Enjoys trying new cuisines",
    isActive: true,
  },
  {
    name: "Elder Thompson",
    email: "elder.thompson@missionary.org",
    dinnerPreferences: ["BBQ", "Comfort food"],
    allergies: [],
    notes: "Big appetite, loves BBQ",
    isActive: true,
  },
  {
    name: "Elder Garcia",
    email: "elder.garcia@missionary.org",
    dinnerPreferences: ["Mexican", "Traditional"],
    allergies: ["Dairy"],
    notes: "Lactose intolerant, speaks Spanish fluently",
    isActive: true,
  },
  {
    name: "Elder Brown",
    email: "elder.brown@missionary.org",
    dinnerPreferences: ["Pizza", "Sandwiches"],
    allergies: [],
    notes: "Simple food preferences",
    isActive: true,
  },
  {
    name: "Elder Taylor",
    email: "elder.taylor@missionary.org",
    dinnerPreferences: ["Gluten-free", "Salads"],
    allergies: ["Gluten"],
    notes: "Has celiac disease - strict gluten-free diet required",
    isActive: true,
  },
  {
    name: "Elder Anderson",
    email: "elder.anderson@missionary.org",
    dinnerPreferences: ["Tex-Mex", "Burgers"],
    allergies: [],
    notes: "Very active, big appetite",
    isActive: true,
  },
  {
    name: "Elder Martinez",
    email: "elder.martinez@missionary.org",
    dinnerPreferences: ["Grilled food", "Traditional"],
    allergies: [],
    notes: "Loves outdoor activities and hearty meals",
    isActive: true,
  },
];

// Sample companionships (will be linked to missionaries after creation)
const SAMPLE_COMPANIONSHIPS = [
  {
    area: "Downtown",
    address: "123 Main St, Apt 4B",
    apartmentNumber: "4B",
    phone: "(555) 123-4567",
    notes: "Prefer dinner between 5-7 PM. Good with most families.",
    missionaryNames: ["Elder Smith", "Elder Johnson"],
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday through Saturday
  },
  {
    area: "Northside",
    address: "456 Oak Avenue, Unit 12",
    apartmentNumber: "12",
    phone: "(555) 234-5678",
    notes: "Available most evenings. Love trying new cuisines!",
    missionaryNames: ["Elder Davis", "Elder Wilson"],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
  },
  {
    area: "Eastside",
    address: "789 Pine Street, Apt 7",
    apartmentNumber: "7",
    phone: "(555) 345-6789",
    notes: "Elder Garcia speaks Spanish fluently. Prefer family-style meals.",
    missionaryNames: ["Elder Thompson", "Elder Garcia"],
    daysOfWeek: [2, 3, 4, 5, 6], // Tuesday through Saturday
  },
  {
    area: "Westside",
    address: "321 Elm Drive, #15",
    apartmentNumber: "15",
    phone: "(555) 456-7890",
    notes: "Elder Taylor has celiac disease. Need gluten-free options.",
    missionaryNames: ["Elder Brown", "Elder Taylor"],
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
  },
  {
    area: "Southside",
    address: "654 Maple Court, Unit 3A",
    apartmentNumber: "3A",
    phone: "(555) 567-8901",
    notes: "Very active and have big appetites. Love outdoor activities.",
    missionaryNames: ["Elder Anderson", "Elder Martinez"],
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday through Saturday
  },
];

// Generate dinner slots for the next 4 weeks based on companionship schedules
const generateDinnerSlots = (
  companionships: {
    id: string;
    daysOfWeek: number[];
    missionaryCount: number;
  }[],
): Omit<DinnerSlot, "id" | "createdAt" | "updatedAt">[] => {
  const slots: Omit<DinnerSlot, "id" | "createdAt" | "updatedAt">[] = [];
  const today = new Date();
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Generate slots for next 4 weeks
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + week * 7 + day + 1); // Start from tomorrow

      const dayOfWeek = date.getDay();

      // Each companionship gets slots based on their available days
      companionships.forEach((companionship) => {
        // Only create slots for days this companionship is available
        if (companionship.daysOfWeek.includes(dayOfWeek)) {
          slots.push({
            companionshipId: companionship.id,
            date,
            dayOfWeek: daysOfWeek[dayOfWeek],
            status: "available",
            guestCount: companionship.missionaryCount,
            notes: "",
            createdBy: "system-seed",
          });
        }
      });
    }
  }

  return slots;
};

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log("🌱 Starting database seeding...");

    // Step 1: Create individual missionaries
    console.log("📝 Creating individual missionaries...");
    const missionaryMap = new Map<string, string>(); // name -> id

    for (const missionary of SAMPLE_MISSIONARIES) {
      const missionaryData = {
        ...missionary,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(
        collection(db, "missionaries"),
        missionaryData,
      );
      missionaryMap.set(missionary.name, docRef.id);
      console.log(`✅ Created missionary: ${missionary.name} (${docRef.id})`);
    }

    // Step 2: Create companionships and link missionaries
    console.log("🤝 Creating companionships...");
    const companionshipIds: string[] = [];

    for (const companionshipTemplate of SAMPLE_COMPANIONSHIPS) {
      // Get missionary IDs for this companionship
      const missionaryIds = companionshipTemplate.missionaryNames
        .map((name) => missionaryMap.get(name))
        .filter((id): id is string => id !== undefined);

      const companionshipData: Omit<
        Companionship,
        "id" | "createdAt" | "updatedAt"
      > = {
        area: companionshipTemplate.area,
        address: companionshipTemplate.address,
        apartmentNumber: companionshipTemplate.apartmentNumber,
        phone: companionshipTemplate.phone,
        notes: companionshipTemplate.notes,
        missionaryIds,
        daysOfWeek: companionshipTemplate.daysOfWeek,
        isActive: true,
      };

      const docRef = await addDoc(collection(db, "companionships"), {
        ...companionshipData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      companionshipIds.push(docRef.id);
      console.log(
        `✅ Created companionship: ${companionshipTemplate.area} Area (${docRef.id}) with ${missionaryIds.length} missionaries`,
      );
    }

    // Step 3: Generate and create dinner slots
    console.log("📅 Creating dinner slots...");

    // Prepare companionship data for slot generation
    const companionshipData = SAMPLE_COMPANIONSHIPS.map((template, index) => ({
      id: companionshipIds[index],
      daysOfWeek: template.daysOfWeek,
      missionaryCount: template.missionaryNames.length,
    }));

    const dinnerSlots = generateDinnerSlots(companionshipData);

    for (const slot of dinnerSlots) {
      const slotData = {
        ...slot,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "dinnerSlots"), slotData);
    }

    console.log(`✅ Created ${dinnerSlots.length} dinner slots`);

    // Step 4: Create a sample admin user (optional)
    console.log("👤 Creating sample admin user...");
    const adminUserId = "REPLACE_WITH_YOUR_USER_ID"; // You'll need to replace this
    const adminUserData = {
      id: adminUserId,
      name: "Administrator",
      email: "admin@example.com",
      role: "admin",
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        reminderDaysBefore: 1,
      },
    };

    // Only create if you provide a real user ID
    if (adminUserId !== "REPLACE_WITH_YOUR_USER_ID") {
      await setDoc(doc(db, "users", adminUserId), adminUserData);
      console.log("✅ Created admin user");
    } else {
      console.log(
        "⚠️  Skipped admin user creation - update adminUserId in seedData.ts",
      );
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(
      `   - ${SAMPLE_MISSIONARIES.length} individual missionaries created`,
    );
    console.log(`   - ${SAMPLE_COMPANIONSHIPS.length} companionships created`);
    console.log(`   - ${dinnerSlots.length} dinner slots created`);
    console.log(`   - Ready for signups!`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

export const clearTestData = async (): Promise<void> => {
  console.log("🧹 Note: Manual cleanup required");
  console.log("Please use Firebase Console or Admin SDK to clear test data");
  console.log(
    "Collections to clear: missionaries, companionships, dinnerSlots, signups",
  );
};
