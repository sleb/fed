const admin = require("firebase-admin");

// Initialize Firebase Admin SDK for emulator
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "bp-fed",
  });
}

// Use admin firestore (bypasses security rules)
const db = admin.firestore();

// Connect to emulator
db.settings({
  host: "localhost:8080",
  ssl: false,
});

console.log("🔌 Connected to Firestore emulator with admin privileges");

// Sample individual missionaries
const SAMPLE_MISSIONARIES = [
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

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Step 1: Create individual missionaries
    console.log("📝 Creating individual missionaries...");
    const missionaryMap = new Map(); // name -> id

    for (const missionary of SAMPLE_MISSIONARIES) {
      const missionaryData = {
        ...missionary,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      const docRef = await db.collection("missionaries").add(missionaryData);
      missionaryMap.set(missionary.name, docRef.id);
      console.log(`✅ Created missionary: ${missionary.name} (${docRef.id})`);
    }

    // Step 2: Create companionships and link missionaries
    console.log("🤝 Creating companionships...");
    const companionshipIds = [];

    for (const companionshipTemplate of SAMPLE_COMPANIONSHIPS) {
      // Get missionary IDs for this companionship
      const missionaryIds = companionshipTemplate.missionaryNames
        .map((name) => missionaryMap.get(name))
        .filter((id) => id !== undefined);

      const companionshipData = {
        area: companionshipTemplate.area,
        address: companionshipTemplate.address,
        apartmentNumber: companionshipTemplate.apartmentNumber,
        phone: companionshipTemplate.phone,
        notes: companionshipTemplate.notes,
        missionaryIds,
        daysOfWeek: companionshipTemplate.daysOfWeek,
        isActive: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      const docRef = await db.collection("companionships").add(companionshipData);
      companionshipIds.push(docRef.id);
      console.log(
        `✅ Created companionship: ${companionshipTemplate.area} Area (${docRef.id}) with ${missionaryIds.length} missionaries`
      );
    }

    // Step 3: Create a sample admin user
    console.log("👤 Creating sample admin user...");
    const adminUserId = "admin-user-123";
    const adminUserData = {
      name: "Test Admin",
      email: "admin@test.com",
      phone: "(555) 000-0000",
      address: "123 Admin St",
      role: "admin",
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        reminderDaysBefore: 1,
      },
      stats: {
        totalSignups: 0,
        completedDinners: 0,
        cancelledDinners: 0,
      },
      createdAt: admin.firestore.Timestamp.now(),
      lastLoginAt: admin.firestore.Timestamp.now(),
    };

    await db.collection("users").doc(adminUserId).set(adminUserData);
    console.log("✅ Created admin user");

    // Step 4: Create a sample regular user
    console.log("👤 Creating sample member user...");
    const memberUserId = "member-user-456";
    const memberUserData = {
      name: "Test Member",
      email: "member@test.com",
      phone: "(555) 111-1111",
      address: "456 Member Ave",
      role: "member",
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        reminderDaysBefore: 2,
      },
      stats: {
        totalSignups: 0,
        completedDinners: 0,
        cancelledDinners: 0,
      },
      createdAt: admin.firestore.Timestamp.now(),
      lastLoginAt: admin.firestore.Timestamp.now(),
    };

    await db.collection("users").doc(memberUserId).set(memberUserData);
    console.log("✅ Created member user");

    console.log("🎉 Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - ${SAMPLE_MISSIONARIES.length} individual missionaries created`);
    console.log(`   - ${SAMPLE_COMPANIONSHIPS.length} companionships created`);
    console.log(`   - 1 admin user created (ID: ${adminUserId})`);
    console.log(`   - 1 member user created (ID: ${memberUserId})`);
    console.log(`   - Dynamic slots enabled - no pre-generation needed`);
    console.log(`   - Ready for signups!`);

    console.log("\n📝 Next steps:");
    console.log("   1. Go to the calendar page and try signing up for dinners");
    console.log("   2. Test both admin and member functionality");
    console.log("   3. Check that virtual slots are generated correctly");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "seed":
        await seedDatabase();
        break;
      default:
        console.log("🌱 Firebase Emulator Seeding Tool\n");
        console.log("Usage: node seedEmulator.js <command>\n");
        console.log("Commands:");
        console.log("  seed    - Seed the emulator database with test data");
        break;
    }
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  seedDatabase,
};
