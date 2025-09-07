import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./config";

export class EmulatorUtils {
  // Check if we're running in emulator mode
  static isEmulator(): boolean {
    return (
      process.env.NODE_ENV === "development" ||
      (typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"))
    );
  }

  // Clear all data from a collection
  static async clearCollection(collectionName: string): Promise<void> {
    if (!this.isEmulator()) {
      console.warn("⚠️ Not running in emulator - skipping clear operation");
      return;
    }

    console.log(`🧹 Clearing collection: ${collectionName}`);

    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      if (snapshot.empty) {
        console.log(`✅ Collection ${collectionName} is already empty`);
        return;
      }

      const batch = writeBatch(db);
      let deleteCount = 0;

      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
        deleteCount++;
      });

      await batch.commit();
      console.log(`✅ Deleted ${deleteCount} documents from ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error clearing collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Clear all collections
  static async clearAllData(): Promise<void> {
    if (!this.isEmulator()) {
      console.warn("⚠️ Not running in emulator - skipping clear operation");
      return;
    }

    console.log("🧹 Clearing all emulator data...");

    const collections = ["signups", "companionships", "missionaries", "users"];

    for (const collectionName of collections) {
      await this.clearCollection(collectionName);
    }

    console.log("🎉 All emulator data cleared!");
  }

  // Check for problematic signups (missing userId)
  static async checkSignupData(): Promise<void> {
    console.log("🔍 Checking signup data for issues...");

    try {
      const signupsRef = collection(db, "signups");
      const snapshot = await getDocs(signupsRef);

      if (snapshot.empty) {
        console.log("✅ No signups in database");
        return;
      }

      let totalSignups = 0;
      let problematicSignups = 0;
      const issuesFound: string[] = [];

      snapshot.docs.forEach((document) => {
        totalSignups++;
        const data = document.data();

        // Check for missing userId
        if (!data.userId) {
          problematicSignups++;
          issuesFound.push(`Document ${document.id}: Missing userId`);
        }

        // Check for invalid userId type
        if (data.userId && typeof data.userId !== "string") {
          problematicSignups++;
          issuesFound.push(
            `Document ${document.id}: Invalid userId type (${typeof data.userId})`,
          );
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

      console.log(`📊 Signup Analysis:`);
      console.log(`   Total signups: ${totalSignups}`);
      console.log(`   Problematic signups: ${problematicSignups}`);

      if (issuesFound.length > 0) {
        console.log("❌ Issues found:");
        issuesFound.forEach((issue) => console.log(`   - ${issue}`));
      } else {
        console.log("✅ All signups look good!");
      }
    } catch (error) {
      console.error("❌ Error checking signup data:", error);
      throw error;
    }
  }

  // Remove problematic signups
  static async cleanupProblematicSignups(): Promise<void> {
    if (!this.isEmulator()) {
      console.warn("⚠️ Not running in emulator - skipping cleanup operation");
      return;
    }

    console.log("🧹 Cleaning up problematic signups...");

    try {
      const signupsRef = collection(db, "signups");
      const snapshot = await getDocs(signupsRef);

      if (snapshot.empty) {
        console.log("✅ No signups to clean");
        return;
      }

      let deletedCount = 0;
      const batch = writeBatch(db);

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
      console.error("❌ Error cleaning up signups:", error);
      throw error;
    }
  }

  // List all collections and their document counts
  static async inspectDatabase(): Promise<void> {
    console.log("🔍 Inspecting emulator database...");

    const collections = ["users", "missionaries", "companionships", "signups"];

    for (const collectionName of collections) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        console.log(`📁 ${collectionName}: ${snapshot.docs.length} documents`);

        // Show sample document structure for non-empty collections
        if (!snapshot.empty && snapshot.docs.length > 0) {
          const sampleDoc = snapshot.docs[0];
          const sampleData = sampleDoc.data();
          const fields = Object.keys(sampleData);
          console.log(`   Sample fields: ${fields.join(", ")}`);
        }
      } catch (error) {
        console.error(`❌ Error inspecting ${collectionName}:`, error);
      }
    }
  }
}

// Convenience functions for console use
export const clearEmulatorData = () => EmulatorUtils.clearAllData();
export const checkSignups = () => EmulatorUtils.checkSignupData();
export const cleanupSignups = () => EmulatorUtils.cleanupProblematicSignups();
export const inspectDatabase = () => EmulatorUtils.inspectDatabase();
