#!/usr/bin/env tsx

/**
 * Script para verificar treinos antigos no banco de dados
 * Procura por dados históricos em todas as coleções e subcoleções
 */

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

interface WorkoutData {
  id: string;
  userId: string;
  type: string;
  date: Date;
  exercises: any[];
  workoutNotes?: string;
}

class OldWorkoutsChecker {
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

  async findAllWorkouts(): Promise<WorkoutData[]> {
    console.log('🔍 Searching for all workouts in the database...');

    const allWorkouts: WorkoutData[] = [];

    try {
      // Check legacy workouts collection
      console.log('📂 Checking legacy workouts collection...');
      const legacyWorkouts = await this.db.collection('workouts').get();

      legacyWorkouts.docs.forEach(doc => {
        const data = doc.data();
        if (data.date) {
          allWorkouts.push({
            id: doc.id,
            userId: data.userId || 'unknown',
            type: data.type || 'unknown',
            date: data.date.toDate ? data.date.toDate() : new Date(data.date),
            exercises: data.exercises || [],
            workoutNotes: data.workoutNotes
          });
        }
      });

      console.log(`   Found ${legacyWorkouts.size} workouts in legacy collection`);

      // Check new hierarchical structure
      console.log('📂 Checking new hierarchical workouts subcollections...');
      const usersCollection = await this.db.collection('users').listDocuments();

      for (const userRef of usersCollection) {
        try {
          const userId = userRef.id;
          const workoutsSub = await userRef.collection('workouts').get();

          workoutsSub.docs.forEach(doc => {
            const data = doc.data();
            if (data.date) {
              allWorkouts.push({
                id: doc.id,
                userId: userId,
                type: data.type || 'unknown',
                date: data.date.toDate ? data.date.toDate() : new Date(data.date),
                exercises: data.exercises || [],
                workoutNotes: data.workoutNotes
              });
            }
          });

          if (!workoutsSub.empty) {
            console.log(`   User ${userId}: ${workoutsSub.size} workouts`);
          }
        } catch (error) {
          // Subcollection might not exist
        }
      }

      // Sort by date (newest first)
      allWorkouts.sort((a, b) => b.date.getTime() - a.date.getTime());

      console.log(`📊 Total workouts found: ${allWorkouts.length}`);
      return allWorkouts;

    } catch (error) {
      console.error('❌ Error searching for workouts:', error);
      throw error;
    }
  }

  async findWorkoutsOlderThan(months: number): Promise<WorkoutData[]> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    console.log(`🔍 Finding workouts older than ${months} months (${cutoffDate.toLocaleDateString()})...`);

    const allWorkouts = await this.findAllWorkouts();
    const oldWorkouts = allWorkouts.filter(workout => workout.date < cutoffDate);

    console.log(`📊 Found ${oldWorkouts.length} workouts older than ${months} months`);
    return oldWorkouts;
  }

  printWorkoutsReport(workouts: WorkoutData[], title: string): void {
    console.log('\n' + '='.repeat(100));
    console.log(`🏋️ ${title}`);
    console.log('='.repeat(100));

    if (workouts.length === 0) {
      console.log('❌ No workouts found');
      return;
    }

    console.log('Date'.padStart(12) + 'User ID'.padEnd(32) + 'Type'.padStart(8) + 'Exercises'.padStart(10) + 'Notes'.padStart(6));
    console.log('-'.repeat(100));

    workouts.slice(0, 20).forEach(workout => { // Show first 20
      const dateStr = workout.date.toLocaleDateString();
      const userId = workout.userId.substring(0, 30) + '...';
      const type = workout.type.padStart(8);
      const exercises = workout.exercises.length.toString().padStart(10);
      const hasNotes = workout.workoutNotes ? '📝' : '❌';

      console.log(
        dateStr.padStart(12) +
        userId.padEnd(32) +
        type +
        exercises +
        hasNotes.padStart(6)
      );
    });

    if (workouts.length > 20) {
      console.log(`... and ${workouts.length - 20} more workouts`);
    }

    console.log('='.repeat(100));
    console.log(`Total: ${workouts.length} workouts`);

    // Show date range
    if (workouts.length > 0) {
      const oldest = workouts[workouts.length - 1].date;
      const newest = workouts[0].date;
      console.log(`Date range: ${oldest.toLocaleDateString()} to ${newest.toLocaleDateString()}`);
    }
  }

  async checkForHalnowkaData(): Promise<void> {
    console.log('\n🔍 Checking for any data that might belong to halnowka@gmail.com...');

    // Check all collections for any references to halnowka
    const collections = ['weights', 'workouts', 'userProgress'];

    for (const collectionName of collections) {
      try {
        const snapshot = await this.db.collection(collectionName).get();
        console.log(`   ${collectionName}: ${snapshot.size} documents`);

        // Look for any documents that might contain email-like data
        snapshot.docs.slice(0, 5).forEach(doc => {
          const data = doc.data();
          const dataStr = JSON.stringify(data).toLowerCase();
          if (dataStr.includes('haln') || dataStr.includes('gmail')) {
            console.log(`   🚨 Possible halnowka data in ${collectionName}/${doc.id}:`, data);
          }
        });
      } catch (error) {
        console.log(`   Error checking ${collectionName}:`, (error as Error).message);
      }
    }

    // Check user subcollections
    console.log('   Checking user subcollections...');
    const usersCollection = await this.db.collection('users').listDocuments();

    for (const userRef of usersCollection) {
      const subcollections = ['weights', 'workouts', 'progress'];
      for (const subName of subcollections) {
        try {
          const subSnapshot = await userRef.collection(subName).get();
          if (!subSnapshot.empty) {
            console.log(`   User ${userRef.id}/${subName}: ${subSnapshot.size} documents`);
          }
        } catch (error) {
          // Subcollection might not exist
        }
      }
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const checker = new OldWorkoutsChecker();

    switch (command) {
      case 'all':
        const allWorkouts = await checker.findAllWorkouts();
        checker.printWorkoutsReport(allWorkouts, 'ALL WORKOUTS IN DATABASE');
        break;

      case 'old':
        const months = parseInt(args[1]) || 3;
        const oldWorkouts = await checker.findWorkoutsOlderThan(months);
        checker.printWorkoutsReport(oldWorkouts, `WORKOUTS OLDER THAN ${months} MONTHS`);
        break;

      case 'halnowka':
        await checker.checkForHalnowkaData();
        break;

      default:
        console.log('🔍 Old Workouts Checker Commands:');
        console.log('  all              - Show all workouts in database');
        console.log('  old <months>     - Show workouts older than X months (default: 3)');
        console.log('  halnowka         - Search for any halnowka-related data');
        console.log('');
        console.log('Examples:');
        console.log('  npm run check-old-workouts all');
        console.log('  npm run check-old-workouts old 6');
        console.log('  npm run check-old-workouts halnowka');
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

export { OldWorkoutsChecker };
