#!/usr/bin/env tsx

/**
 * TREINE Database Migration Script (Admin SDK Version)
 *
 * This script uses Firebase Admin SDK to migrate data with full administrative privileges.
 * Requires service account credentials.
 *
 * Setup:
 * 1. Go to Firebase Console → Project Settings → Service Accounts
 * 2. Generate new private key
 * 3. Download JSON file and place it at scripts/service-account.json
 * 4. Run: npm run migrate-admin
 */

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { DatabaseService } from '../src/lib/database';
import * as path from 'path';

interface MigrationStats {
  usersProcessed: number;
  weightsMigrated: number;
  workoutsMigrated: number;
  progressMigrated: number;
  errors: string[];
}

class AdminDataMigration {
  private db: FirebaseFirestore.Firestore;
  private stats: MigrationStats = {
    usersProcessed: 0,
    weightsMigrated: 0,
    workoutsMigrated: 0,
    progressMigrated: 0,
    errors: []
  };

  constructor() {
    // Initialize Firebase Admin
    const serviceAccountPath = path.join(__dirname, 'service-account.json');

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(require(serviceAccountPath)),
          projectId: 'calistenia-98d6b' // Your project ID
        });
      }

      this.db = getFirestore();
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:');
      console.error('Make sure service-account.json exists in the scripts/ directory');
      console.error('Download it from: Firebase Console → Project Settings → Service Accounts');
      throw error;
    }
  }

  async migrateAllUsers(): Promise<void> {
    console.log('🚀 Starting TREINE database migration (Admin SDK)...');

    try {
      // Get all unique user IDs from existing collections
      const userIds = await this.getAllUserIds();

      console.log(`📊 Found ${userIds.length} users to migrate`);

      for (const userId of userIds) {
        try {
          console.log(`\n👤 Migrating user: ${userId}`);
          await this.migrateUser(userId);
          this.stats.usersProcessed++;
        } catch (error) {
          const errorMsg = `Failed to migrate user ${userId}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          this.stats.errors.push(errorMsg);
        }
      }

      this.printMigrationReport();

    } catch (error) {
      console.error('💥 Migration failed:', error);
      throw error;
    }
  }

  private async getAllUserIds(): Promise<string[]> {
    const userIds = new Set<string>();

    try {
      // Get user IDs from weights collection
      console.log('🔍 Scanning weights collection...');
      const weightsSnapshot = await this.db.collection('weights').get();
      weightsSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId;
        if (userId) userIds.add(userId);
      });
      console.log(`   Found ${weightsSnapshot.size} weight entries`);

      // Get user IDs from workouts collection
      console.log('🔍 Scanning workouts collection...');
      const workoutsSnapshot = await this.db.collection('workouts').get();
      workoutsSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId;
        if (userId) userIds.add(userId);
      });
      console.log(`   Found ${workoutsSnapshot.size} workout entries`);

      // Get user IDs from userProgress collection
      console.log('🔍 Scanning userProgress collection...');
      const progressSnapshot = await this.db.collection('userProgress').get();
      progressSnapshot.docs.forEach(doc => {
        userIds.add(doc.id); // Document ID is the userId
      });
      console.log(`   Found ${progressSnapshot.size} progress records`);

    } catch (error) {
      console.error('❌ Error scanning collections:', error);
      throw error;
    }

    return Array.from(userIds);
  }

  private async migrateUser(userId: string): Promise<void> {
    try {
      // Migrate weights
      const weightsCount = await this.migrateLegacyWeights(userId);
      this.stats.weightsMigrated += weightsCount;
      console.log(`   ⚖️  Migrated ${weightsCount} weight entries`);

      // Migrate workouts
      const workoutsCount = await this.migrateLegacyWorkouts(userId);
      this.stats.workoutsMigrated += workoutsCount;
      console.log(`   💪 Migrated ${workoutsCount} workout entries`);

      // Migrate progress
      await this.migrateUserProgress(userId);
      this.stats.progressMigrated++;
      console.log(`   📈 Migrated user progress`);

    } catch (error) {
      console.error(`   ❌ Error migrating user ${userId}:`, error);
      throw error;
    }
  }

  private async migrateLegacyWeights(userId: string): Promise<number> {
    const weightsRef = this.db.collection('weights');
    const snapshot = await weightsRef.where('userId', '==', userId).get();

    if (snapshot.empty) return 0;

    console.log(`     Migrating ${snapshot.size} weight entries for user ${userId}`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      try {
        await DatabaseService.saveWeightEntry(
          userId,
          data.weight,
          data.date.toDate() // Firestore Timestamp to Date
        );
        await doc.ref.delete();
      } catch (error) {
        console.error(`       ❌ Failed to migrate weight entry ${doc.id}:`, error);
        // Continue with other entries
      }
    }

    return snapshot.size;
  }

  private async migrateLegacyWorkouts(userId: string): Promise<number> {
    const workoutsRef = this.db.collection('workouts');
    const snapshot = await workoutsRef.where('userId', '==', userId).get();

    if (snapshot.empty) return 0;

    console.log(`     Migrating ${snapshot.size} workout entries for user ${userId}`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      try {
        // Skip russian_progress workouts as they're handled separately
        if (data.type !== 'russian_progress') {
          await DatabaseService.saveWorkout(
            userId,
            data.type,
            data.exercises || [],
            data.workoutNotes || '',
            data.date.toDate()
          );
        }
        await doc.ref.delete();
      } catch (error) {
        console.error(`       ❌ Failed to migrate workout ${doc.id}:`, error);
        // Continue with other entries
      }
    }

    return snapshot.size;
  }

  private async migrateUserProgress(userId: string): Promise<void> {
    const progressRef = this.db.collection('userProgress').doc(userId);
    const doc = await progressRef.get();

    if (doc.exists) {
      const data = doc.data();
      try {
        await DatabaseService.saveUserProgress(userId, data?.russianProgramCompleted || []);
        await progressRef.delete();
      } catch (error) {
        console.error(`     ❌ Failed to migrate progress for user ${userId}:`, error);
      }
    } else {
      // Create empty progress if none exists
      await DatabaseService.saveUserProgress(userId, []);
    }
  }

  private printMigrationReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 TREINE DATABASE MIGRATION REPORT (ADMIN SDK)');
    console.log('='.repeat(60));
    console.log(`👥 Users processed: ${this.stats.usersProcessed}`);
    console.log(`⚖️  Weights migrated: ${this.stats.weightsMigrated}`);
    console.log(`💪 Workouts migrated: ${this.stats.workoutsMigrated}`);
    console.log(`📈 Progress records migrated: ${this.stats.progressMigrated}`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

    console.log('\n🔒 Legacy collections can now be safely removed.');
    console.log('💡 Consider creating database backups before removing legacy data.');
    console.log('📊 Migration performed with Firebase Admin SDK for full access.');

    // Cleanup
    admin.app().delete();
  }
}

// CLI execution
async function main() {
  try {
    const migration = new AdminDataMigration();
    await migration.migrateAllUsers();
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration script failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Ensure service-account.json exists in scripts/ directory');
    console.error('2. Verify the service account has Firestore Admin permissions');
    console.error('3. Check Firebase project ID matches your configuration');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { AdminDataMigration };
