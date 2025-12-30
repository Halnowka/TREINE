#!/usr/bin/env tsx

/**
 * Script para verificar dados de usuários no Firestore
 * Útil para diagnosticar problemas de migração e localizar dados perdidos
 */

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

interface UserData {
  uid: string;
  email?: string;
  weights: number;
  workouts: number;
  progress: boolean;
  lastActivity?: Date;
}

class UserDataChecker {
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

  async findUserByEmail(email: string): Promise<UserData | null> {
    console.log(`🔍 Searching for user with email: ${email}`);

    try {
      // Check legacy collections for user data
      const weightsQuery = await this.db.collection('weights').where('userId', '!=', '').get();
      const workoutsQuery = await this.db.collection('workouts').where('userId', '!=', '').get();
      const progressQuery = await this.db.collection('userProgress').get();

      const userIds = new Set<string>();

      // Collect userIds from weights
      weightsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) userIds.add(data.userId);
      });

      // Collect userIds from workouts
      workoutsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) userIds.add(data.userId);
      });

      // Collect userIds from progress
      progressQuery.docs.forEach(doc => {
        userIds.add(doc.id);
      });

      console.log(`📊 Found ${userIds.size} total users in legacy collections`);

      // For each userId, check if we can find their email
      // Since we don't have direct access to Auth users, we'll need to check by userId
      for (const userId of userIds) {
        const userData = await this.getUserData(userId);
        if (userData && userData.email === email) {
          console.log(`✅ Found user data for ${email} with UID: ${userId}`);
          return userData;
        }
      }

      console.log(`❌ No data found for email: ${email}`);
      return null;

    } catch (error) {
      console.error('❌ Error searching for user:', error);
      throw error;
    }
  }

  async getUserData(userId: string): Promise<UserData | null> {
    try {
      let weightsCount = 0;
      let workoutsCount = 0;
      let hasProgress = false;
      let lastActivity: Date | undefined;

      // Check new hierarchical structure first
      try {
        // Check weights subcollection
        const weightsQuery = await this.db.collection('users').doc(userId).collection('weights').get();
        weightsCount = weightsQuery.size;

        // Check workouts subcollection
        const workoutsQuery = await this.db.collection('users').doc(userId).collection('workouts').get();
        workoutsCount = workoutsQuery.size;

        // Check progress subcollection
        const progressDoc = await this.db.collection('users').doc(userId).collection('progress').doc('progress').get();
        hasProgress = progressDoc.exists;

        // Find last activity from subcollections
        const allDocs = [...weightsQuery.docs, ...workoutsQuery.docs];
        if (allDocs.length > 0) {
          const timestamps = allDocs
            .map(doc => doc.data().date)
            .filter(date => date)
            .map(date => date.toDate ? date.toDate() : new Date(date));

          if (timestamps.length > 0) {
            lastActivity = new Date(Math.max(...timestamps.map(d => d.getTime())));
          }
        }
      } catch (error) {
        // If new structure fails, try legacy collections as fallback
        console.log(`   Trying legacy collections for user ${userId}`);

        const weightsQuery = await this.db.collection('weights').where('userId', '==', userId).get();
        weightsCount = weightsQuery.size;

        const workoutsQuery = await this.db.collection('workouts').where('userId', '==', userId).get();
        workoutsCount = workoutsQuery.size;

        const progressDoc = await this.db.collection('userProgress').doc(userId).get();
        hasProgress = progressDoc.exists;

        if (!weightsQuery.empty || !workoutsQuery.empty) {
          const allDocs = [...weightsQuery.docs, ...workoutsQuery.docs];
          const timestamps = allDocs
            .map(doc => doc.data().date)
            .filter(date => date)
            .map(date => date.toDate ? date.toDate() : new Date(date));

          if (timestamps.length > 0) {
            lastActivity = new Date(Math.max(...timestamps.map(d => d.getTime())));
          }
        }
      }

      return {
        uid: userId,
        weights: weightsCount,
        workouts: workoutsCount,
        progress: hasProgress,
        lastActivity
      };

    } catch (error) {
      console.error(`❌ Error getting data for user ${userId}:`, error);
      return null;
    }
  }

  async listAllUsers(): Promise<UserData[]> {
    console.log('📋 Listing all users with data...');

    try {
      const userIds = new Set<string>();

      // Check legacy collections first
      console.log('🔍 Checking legacy collections...');
      const weightsQuery = await this.db.collection('weights').get();
      const workoutsQuery = await this.db.collection('workouts').get();
      const progressQuery = await this.db.collection('userProgress').get();

      weightsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) userIds.add(data.userId);
      });

      workoutsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) userIds.add(data.userId);
      });

      progressQuery.docs.forEach(doc => {
        userIds.add(doc.id);
      });

      console.log(`📊 Found ${userIds.size} users in legacy collections`);

      // Check new hierarchical collections
      console.log('🔍 Checking new hierarchical collections...');
      const usersCollection = await this.db.collection('users').listDocuments();

      for (const userRef of usersCollection) {
        const userId = userRef.id;
        userIds.add(userId);

        // Check subcollections for this user
        try {
          const weightsSub = await userRef.collection('weights').get();
          const workoutsSub = await userRef.collection('workouts').get();

          if (!weightsSub.empty || !workoutsSub.empty) {
            console.log(`   👤 User ${userId}: ${weightsSub.size} weights, ${workoutsSub.size} workouts`);
          }
        } catch (error) {
          // Subcollection might not exist
        }
      }

      console.log(`📊 Found ${usersCollection.length} users in new collections`);
      console.log(`📊 Total unique users: ${userIds.size}`);

      const users: UserData[] = [];

      for (const userId of userIds) {
        const userData = await this.getUserData(userId);
        if (userData) {
          users.push(userData);
        }
      }

      return users.sort((a, b) => (b.lastActivity?.getTime() || 0) - (a.lastActivity?.getTime() || 0));

    } catch (error) {
      console.error('❌ Error listing users:', error);
      throw error;
    }
  }

  async transferUserData(fromUserId: string, toUserEmail: string): Promise<boolean> {
    console.log(`🔄 Transferring data from user ${fromUserId} to ${toUserEmail}`);

    try {
      // First, find the target user by email (this is a limitation since we can't query auth users)
      // For now, we'll assume the target user is already in the system
      console.log('⚠️  Note: Target user identification requires manual mapping');
      console.log(`    Source user: ${fromUserId}`);
      console.log(`    Target email: ${toUserEmail}`);
      console.log('    You may need to create the target user first or manually map the UID');

      return false; // Not implemented yet - needs user UID mapping

    } catch (error) {
      console.error('❌ Error transferring user data:', error);
      throw error;
    }
  }

  printUserReport(users: UserData[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('👥 USERS DATA REPORT');
    console.log('='.repeat(80));
    console.log('UID'.padEnd(30) + 'Weights'.padStart(8) + 'Workouts'.padStart(10) + 'Progress'.padStart(10) + 'Last Activity'.padStart(15));
    console.log('-'.repeat(80));

    users.forEach(user => {
      const uid = user.uid.substring(0, 28) + '...';
      const weights = user.weights.toString();
      const workouts = user.workouts.toString();
      const progress = user.progress ? '✅' : '❌';
      const lastActivity = user.lastActivity ? user.lastActivity.toLocaleDateString() : 'Never';

      console.log(
        uid.padEnd(30) +
        weights.padStart(8) +
        workouts.padStart(10) +
        progress.padStart(10) +
        lastActivity.padStart(15)
      );
    });

    console.log('='.repeat(80));
    console.log(`Total users: ${users.length}`);
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const checker = new UserDataChecker();

    switch (command) {
      case 'find':
        const email = args[1];
        if (!email) {
          console.error('Usage: npm run check-user find <email>');
          process.exit(1);
        }
        const user = await checker.findUserByEmail(email);
        if (user) {
          console.log('\n👤 User found:');
          console.log(`   UID: ${user.uid}`);
          console.log(`   Weights: ${user.weights}`);
          console.log(`   Workouts: ${user.workouts}`);
          console.log(`   Progress: ${user.progress ? 'Yes' : 'No'}`);
          if (user.lastActivity) {
            console.log(`   Last Activity: ${user.lastActivity.toLocaleString()}`);
          }
        }
        break;

      case 'list':
        const users = await checker.listAllUsers();
        checker.printUserReport(users);
        break;

      case 'transfer':
        const fromUid = args[1];
        const toEmail = args[2];
        if (!fromUid || !toEmail) {
          console.error('Usage: npm run check-user transfer <fromUid> <toEmail>');
          process.exit(1);
        }
        await checker.transferUserData(fromUid, toEmail);
        break;

      default:
        console.log('🔍 User Data Checker Commands:');
        console.log('  find <email>     - Find user by email');
        console.log('  list             - List all users with data');
        console.log('  transfer <uid> <email> - Transfer user data');
        console.log('');
        console.log('Examples:');
        console.log('  npm run check-user find halnowka@gmail.com');
        console.log('  npm run check-user list');
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

export { UserDataChecker };
