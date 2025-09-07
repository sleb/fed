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

async function inspectDatabase() {
  console.log("🔍 Inspecting emulator database...\n");

  const collections = ["users", "missionaries", "companionships", "signups"];

  for (const collectionName of collections) {
    try {
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();

      console.log(`📁 ${collectionName}: ${snapshot.docs.length} documents`);

      if (!snapshot.empty && snapshot.docs.length > 0) {
        const sampleDoc = snapshot.docs[0];
        const sampleData = sampleDoc.data();
        const fields = Object.keys(sampleData);
        console.log(`   Sample fields: ${fields.join(", ")}`);

        // For signups and users, show more detail
        if (collectionName === "signups" || collectionName === "users") {
          console.log(`   Sample data:`, JSON.stringify(sampleData, null, 2));
        }
      }
      console.log("");
    } catch (error) {
      console.error(`❌ Error inspecting ${collectionName}:`, error.message);
    }
  }

  // Show all users with their details
  try {
    console.log("\n👥 All Users in Database:");
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log("   No users found");
    } else {
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. User ID: ${doc.id}`);
        console.log(`      Name: ${data.name || "N/A"}`);
        console.log(`      Email: ${data.email || "N/A"}`);
        console.log(`      Role: ${data.role || "N/A"}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error listing users:", error.message);
  }
}

async function checkSignupData() {
  console.log("🔍 Checking signup data for issues...\n");

  try {
    const signupsRef = db.collection("signups");
    const snapshot = await signupsRef.get();

    if (snapshot.empty) {
      console.log("✅ No signups in database");
      return;
    }

    let totalSignups = 0;
    let problematicSignups = 0;
    const issuesFound = [];
    const problematicDocs = [];

    snapshot.docs.forEach((document) => {
      totalSignups++;
      const data = document.data();

      console.log(`\n📄 Document ${document.id}:`);
      console.log("   Data:", JSON.stringify(data, null, 2));

      // Check for missing userId
      if (!data.userId) {
        problematicSignups++;
        issuesFound.push(`Document ${document.id}: Missing userId`);
        problematicDocs.push(document.id);
      }

      // Check for invalid userId type
      if (data.userId && typeof data.userId !== "string") {
        problematicSignups++;
        issuesFound.push(
          `Document ${document.id}: Invalid userId type (${typeof data.userId})`,
        );
        problematicDocs.push(document.id);
      }

      // Check for missing required fields
      const requiredFields = [
        "companionshipId",
        "dinnerDate",
        "userName",
        "userEmail",
      ];
      requiredFields.forEach((field) => {
        if (!data[field]) {
          issuesFound.push(`Document ${document.id}: Missing ${field}`);
        }
      });
    });

    console.log(`\n📊 Signup Analysis:`);
    console.log(`   Total signups: ${totalSignups}`);
    console.log(`   Problematic signups: ${problematicSignups}`);

    if (issuesFound.length > 0) {
      console.log("\n❌ Issues found:");
      issuesFound.forEach((issue) => console.log(`   - ${issue}`));

      console.log("\n🗑️  Problematic document IDs:");
      problematicDocs.forEach((id) => console.log(`   - ${id}`));
    } else {
      console.log("\n✅ All signups look good!");
    }

    return problematicDocs;
  } catch (error) {
    console.error("❌ Error checking signup data:", error.message);
    throw error;
  }
}

async function cleanupProblematicSignups() {
  console.log("🧹 Cleaning up problematic signups...\n");

  try {
    const signupsRef = db.collection("signups");
    const snapshot = await signupsRef.get();

    if (snapshot.empty) {
      console.log("✅ No signups to clean");
      return;
    }

    let deletedCount = 0;
    const batch = db.batch();

    snapshot.docs.forEach((document) => {
      const data = document.data();

      // Delete if missing userId or has invalid userId
      if (!data.userId || typeof data.userId !== "string") {
        batch.delete(document.ref);
        deletedCount++;
        console.log(
          `🗑️ Marked for deletion: ${document.id} (missing/invalid userId)`,
        );
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✅ Deleted ${deletedCount} problematic signup documents`);
    } else {
      console.log("✅ No problematic signups found to delete");
    }
  } catch (error) {
    console.error("❌ Error cleaning up signups:", error.message);
    throw error;
  }
}

async function clearCollection(collectionName) {
  console.log(`🧹 Clearing collection: ${collectionName}`);

  try {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log(`✅ Collection ${collectionName} is already empty`);
      return;
    }

    const batch = db.batch();
    let deleteCount = 0;

    snapshot.docs.forEach((document) => {
      batch.delete(document.ref);
      deleteCount++;
    });

    await batch.commit();
    console.log(`✅ Deleted ${deleteCount} documents from ${collectionName}`);
  } catch (error) {
    console.error(
      `❌ Error clearing collection ${collectionName}:`,
      error.message,
    );
    throw error;
  }
}

async function clearAllData() {
  console.log("🧹 Clearing all emulator data...\n");

  const collections = ["signups", "companionships", "missionaries", "users"];

  for (const collectionName of collections) {
    await clearCollection(collectionName);
  }

  console.log("\n🎉 All emulator data cleared!");
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "inspect":
        await inspectDatabase();
        break;
      case "check":
        await checkSignupData();
        break;
      case "cleanup":
        await cleanupProblematicSignups();
        break;
      case "clear":
        await clearAllData();
        break;
      default:
        console.log("🔧 Firebase Emulator Debug Tool\n");
        console.log("Usage: node debugEmulator.js <command>\n");
        console.log("Commands:");
        console.log(
          "  inspect  - Inspect all collections and show sample data",
        );
        console.log("  check    - Check signup data for issues");
        console.log("  cleanup  - Remove problematic signup documents");
        console.log("  clear    - Clear all emulator data");
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
  inspectDatabase,
  checkSignupData,
  cleanupProblematicSignups,
  clearAllData,
};
