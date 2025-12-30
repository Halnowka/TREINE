#!/usr/bin/env tsx

/**
 * Script para recuperar treinos antigos perdidos
 * Move treinos da coleção legacy para o usuário correto
 */

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import { DatabaseService } from '../src/lib/database';

interface WorkoutData {
  id: string;
  userId: string;
  type: string;
  date: Date;
  exercises: any[];
  workoutNotes?: string;
}

class OldWorkoutsRecovery {
  private db: FirebaseFirestore.Firestore;

  constructor() {
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
      throw error;
    }
  }

  async recoverWorkoutsForUser(targetUserId: string): Promise<void> {
    console.log(`🔄 Recovering old workouts for user: ${targetUserId}`);

    try {
      // Find workouts in legacy collection that don't have a valid userId
      const legacyWorkouts = await this.db.collection('workouts').get();
      const orphanedWorkouts: WorkoutData[] = [];

      legacyWorkouts.docs.forEach(doc => {
        const data = doc.data();
        if (data.date && (!data.userId || data.userId === 'unknown' || data.userId === '')) {
          orphanedWorkouts.push({
            id: doc.id,
            userId: targetUserId, // Assign to target user
            type: data.type || 'pull',
            date: data.date.toDate ? data.date.toDate() : new Date(data.date),
            exercises: data.exercises || [],
            workoutNotes: data.workoutNotes
          });
        }
      });

      console.log(`📊 Found ${orphanedWorkouts.length} orphaned workouts to recover`);

      if (orphanedWorkouts.length === 0) {
        console.log('✅ No orphaned workouts found to recover');
        return;
      }

      // Sort by date and migrate them
      orphanedWorkouts.sort((a, b) => a.date.getTime() - b.date.getTime());

      let migratedCount = 0;
      for (const workout of orphanedWorkouts) {
        try {
          console.log(`   Migrating workout from ${workout.date.toLocaleDateString()}: ${workout.type} with ${workout.exercises.length} exercises`);

          await DatabaseService.saveWorkout(
            targetUserId,
            workout.type as 'push' | 'pull' | 'russian',
            workout.exercises,
            workout.workoutNotes,
            workout.date
          );

          // Remove from legacy collection
          await this.db.collection('workouts').doc(workout.id).delete();

          migratedCount++;
        } catch (error) {
          console.error(`   ❌ Failed to migrate workout ${workout.id}:`, error);
        }
      }

      console.log(`✅ Successfully recovered ${migratedCount} workouts for user ${targetUserId}`);
      console.log(`📅 Date range: ${orphanedWorkouts[0]?.date.toLocaleDateString()} to ${orphanedWorkouts[orphanedWorkouts.length - 1]?.date.toLocaleDateString()}`);

    } catch (error) {
      console.error('❌ Error recovering workouts:', error);
      throw error;
    }
  }

  async showRecoveryPreview(targetUserId: string): Promise<void> {
    console.log(`🔍 Preview of workouts that would be recovered for user: ${targetUserId}`);

    try {
      const legacyWorkouts = await this.db.collection('workouts').get();
      const orphanedWorkouts: WorkoutData[] = [];

      legacyWorkouts.docs.forEach(doc => {
        const data = doc.data();
        if (data.date && (!data.userId || data.userId === 'unknown' || data.userId === '')) {
          orphanedWorkouts.push({
            id: doc.id,
            userId: targetUserId,
            type: data.type || 'pull',
            date: data.date.toDate ? data.date.toDate() : new Date(data.date),
            exercises: data.exercises || [],
            workoutNotes: data.workoutNotes
          });
        }
      });

      console.log('\n' + '='.repeat(80));
      console.log(`ORPHANED WORKOUTS PREVIEW (${orphanedWorkouts.length} found)`);
      console.log('='.repeat(80));

      if (orphanedWorkouts.length === 0) {
        console.log('No orphaned workouts found.');
        return;
      }

      console.log('Date'.padStart(12) + 'Type'.padStart(8) + 'Exercises'.padStart(10) + 'Has Notes'.padStart(10));
      console.log('-'.repeat(80));

      orphanedWorkouts.slice(0, 10).forEach(workout => {
        const dateStr = workout.date.toLocaleDateString();
        const type = workout.type.padStart(8);
        const exercises = workout.exercises.length.toString().padStart(10);
        const hasNotes = workout.workoutNotes ? 'Yes' : 'No';

        console.log(
          dateStr.padStart(12) +
          type +
          exercises +
          hasNotes.padStart(10)
        );
      });

      if (orphanedWorkouts.length > 10) {
        console.log(`... and ${orphanedWorkouts.length - 10} more workouts`);
      }

      console.log('='.repeat(80));
      console.log(`These ${orphanedWorkouts.length} workouts will be assigned to user: ${targetUserId}`);
      console.log('Run: npm run recover-workouts <userId> to perform the recovery');

    } catch (error) {
      console.error('❌ Error creating preview:', error);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const recovery = new OldWorkoutsRecovery();

    switch (command) {
      case 'preview':
        const previewUserId = args[1];
        if (!previewUserId) {
          console.error('Usage: npm run recover-workouts preview <userId>');
          process.exit(1);
        }
        await recovery.showRecoveryPreview(previewUserId);
        break;

      case 'recover':
        const recoverUserId = args[1];
        if (!recoverUserId) {
          console.error('Usage: npm run recover-workouts recover <userId>');
          process.exit(1);
        }
        await recovery.recoverWorkoutsForUser(recoverUserId);
        break;

      default:
        console.log('🔄 Workout Recovery Commands:');
        console.log('  preview <userId>  - Show workouts that would be recovered');
        console.log('  recover <userId>  - Recover orphaned workouts for user');
        console.log('');
        console.log('Examples:');
        console.log('  npm run recover-workouts preview nQUYDdkNuzanM1n0igXNkdzzl8x2');
        console.log('  npm run recover-workouts recover nQUYDdkNuzanM1n0igXNkdzzl8x2');
        console.log('');
        console.log('Available user IDs:');
        console.log('  nQUYDdkNuzanM1n0igXNkdzzl8x2 (has recent weight data)');
        console.log('  fjGP0ft0QmXvcxCOyS8ePdC1OFm1 (empty account)');
        process.exit(1);
    }

    admin.app().delete();
    process.exit(0);

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { OldWorkoutsRecovery };
