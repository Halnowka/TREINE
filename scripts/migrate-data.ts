#!/usr/bin/env tsx

/**
 * Data Migration Script for TREINE Database Reorganization
 *
 * This script migrates data from the old flat collections to the new
 * hierarchical structure with subcollections under users/{userId}/
 *
 * Run with: npm run migrate-data
 */

import { DatabaseService } from '../src/lib/database';
import { db } from '../src/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';

interface MigrationStats {
  usersProcessed: number;
  weightsMigrated: number;
  workoutsMigrated: number;
  progressMigrated: number;
  errors: string[];
}

class DataMigration {
  private stats: MigrationStats = {
    usersProcessed: 0,
    weightsMigrated: 0,
    workoutsMigrated: 0,
    progressMigrated: 0,
    errors: []
  };

  async migrateAllUsers(): Promise<void> {
    console.log('🚀 Starting TREINE database migration...');

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

    // Get user IDs from weights collection
    const weightsQuery = query(collection(db, 'weights'));
    const weightsSnapshot = await getDocs(weightsQuery);
    weightsSnapshot.docs.forEach(doc => {
      const userId = doc.data().userId;
      if (userId) userIds.add(userId);
    });

    // Get user IDs from workouts collection
    const workoutsQuery = query(collection(db, 'workouts'));
    const workoutsSnapshot = await getDocs(workoutsQuery);
    workoutsSnapshot.docs.forEach(doc => {
      const userId = doc.data().userId;
      if (userId) userIds.add(userId);
    });

    // Get user IDs from userProgress collection
    const progressQuery = query(collection(db, 'userProgress'));
    const progressSnapshot = await getDocs(progressQuery);
    progressSnapshot.docs.forEach(doc => {
      userIds.add(doc.id); // Document ID is the userId
    });

    return Array.from(userIds);
  }

  private async migrateUser(userId: string): Promise<void> {
    // Migrate weights
    const weightsCount = await DatabaseService.migrateLegacyWeights(userId);
    this.stats.weightsMigrated += weightsCount;
    console.log(`   ⚖️  Migrated ${weightsCount} weight entries`);

    // Migrate workouts
    const workoutsCount = await DatabaseService.migrateLegacyWorkouts(userId);
    this.stats.workoutsMigrated += workoutsCount;
    console.log(`   💪 Migrated ${workoutsCount} workout entries`);

    // Migrate progress
    await this.migrateUserProgress(userId);
    this.stats.progressMigrated++;
    console.log(`   📈 Migrated user progress`);
  }

  private async migrateUserProgress(userId: string): Promise<void> {
    const legacyProgressRef = doc(db, 'userProgress', userId);
    const legacyDoc = await getDoc(legacyProgressRef);

    if (legacyDoc.exists()) {
      const data = legacyDoc.data();
      const progressData = {
        userId,
        russianProgramCompleted: data.russianProgramCompleted || [],
        lastUpdated: Timestamp.fromDate(new Date()),
      };

      await DatabaseService.saveUserProgress(userId, progressData.russianProgramCompleted);
    } else {
      // Create empty progress if none exists
      await DatabaseService.saveUserProgress(userId, []);
    }
  }

  private printMigrationReport(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📋 MIGRATION REPORT');
    console.log('='.repeat(50));
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
  }
}

// CLI execution
async function main() {
  try {
    const migration = new DataMigration();
    await migration.migrateAllUsers();
    process.exit(0);
  } catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DataMigration };
