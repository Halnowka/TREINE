import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  WeightEntry,
  SavedWorkout,
  FirestoreWeightEntrySchema,
  FirestoreWorkoutSchema,
  FirestoreUserProgressSchema,
  SetData,
  ExerciseLogEntry,
  ExerciseDefinition,
} from '@/types';

// Collection references
const getUserWeightsRef = (userId: string) => collection(db, 'users', userId, 'weights');
const getUserWorkoutsRef = (userId: string) => collection(db, 'users', userId, 'workouts');
const getUserProgressRef = (userId: string) => doc(db, 'users', userId, 'progress', 'progress');

// Legacy collections (for migration)
const getLegacyWeightsRef = () => collection(db, 'weights');
const getLegacyWorkoutsRef = () => collection(db, 'workouts');
const getLegacyUserProgressRef = (userId: string) => doc(db, 'userProgress', userId);

// Database operations with validation

export class DatabaseService {
  // Weight operations
  static async saveWeightEntry(userId: string, weight: number, date: Date = new Date()) {
    const weightData = {
      userId,
      weight,
      date: Timestamp.fromDate(date),
    };

    // Validate data
    FirestoreWeightEntrySchema.parse(weightData);

    const docRef = await addDoc(getUserWeightsRef(userId), weightData);
    return docRef.id;
  }

  static async getWeightHistory(userId: string, limitCount: number = 50) {
    const q = query(
      getUserWeightsRef(userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      weight: doc.data().weight,
      date: (doc.data().date as Timestamp).toDate().toISOString(),
    })) as WeightEntry[];
  }

  static async getLatestWeight(userId: string): Promise<WeightEntry | null> {
    const weights = await this.getWeightHistory(userId, 1);
    return weights.length > 0 ? weights[0] : null;
  }

  // Workout operations
  static async saveWorkout(
    userId: string,
    type: 'push' | 'pull' | 'russian',
    exercises: ExerciseLogEntry[],
    workoutNotes?: string,
    date: Date = new Date()
  ) {
    // Sanitize exercises data
    const sanitizedExercises = exercises
      .filter(ex => ex.sets.length > 0)
      .map(ex => ({
        ...ex,
        sets: ex.sets.map(set => {
          const sanitizedSet: any = {
            id: set.id,
            reps: Math.max(1, Math.min(1000, set.reps)),
          };
          // Only include weight if it's a valid number
          if (typeof set.weight === 'number' && !isNaN(set.weight) && set.weight >= 0) {
            sanitizedSet.weight = Math.max(0, Math.min(1000, set.weight));
          }
          return sanitizedSet;
        }),
      }));

    const workoutData = {
      userId,
      type,
      exercises: sanitizedExercises,
      workoutNotes: workoutNotes || '',
      date: Timestamp.fromDate(date),
    };

    // Validate data
    FirestoreWorkoutSchema.parse(workoutData);

    const docRef = await addDoc(getUserWorkoutsRef(userId), workoutData);
    return docRef.id;
  }

  static async getWorkoutHistory(
    userId: string,
    limitCount: number = 20,
    startAfterDoc?: QueryDocumentSnapshot
  ) {
    let q = query(
      getUserWorkoutsRef(userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(q);
    const workouts = snapshot.docs.map(doc => ({
      id: doc.id,
      type: doc.data().type,
      exercises: doc.data().exercises,
      workoutNotes: doc.data().workoutNotes,
      date: (doc.data().date as Timestamp).toDate().toISOString(),
    })) as SavedWorkout[];

    return {
      workouts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === limitCount,
    };
  }

  // User progress operations (Russian program)
  static async saveUserProgress(userId: string, russianProgramCompleted: number[]) {
    const progressData = {
      userId,
      russianProgramCompleted: [...new Set(russianProgramCompleted)].sort((a, b) => a - b),
      lastUpdated: Timestamp.fromDate(new Date()),
    };

    // Validate data
    FirestoreUserProgressSchema.parse(progressData);

    await setDoc(getUserProgressRef(userId), progressData, { merge: true });
  }

  static async getUserProgress(userId: string) {
    const docSnap = await getDoc(getUserProgressRef(userId));

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        russianProgramCompleted: data.russianProgramCompleted || [],
        lastUpdated: data.lastUpdated ? (data.lastUpdated as Timestamp).toDate().toISOString() : undefined,
      };
    }

    return {
      russianProgramCompleted: [],
      lastUpdated: undefined,
    };
  }

  // Legacy data migration helpers
  static async migrateLegacyWeights(userId: string) {
    const q = query(getLegacyWeightsRef(), where('userId', '==', userId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    const migrationPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      await this.saveWeightEntry(userId, data.weight, (data.date as Timestamp).toDate());
      return deleteDoc(doc.ref);
    });

    await Promise.all(migrationPromises);
    return snapshot.docs.length;
  }

  static async migrateLegacyWorkouts(userId: string) {
    const q = query(getLegacyWorkoutsRef(), where('userId', '==', userId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    const migrationPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      if (data.type !== 'russian_progress') { // Skip progress workouts
        await this.saveWorkout(
          userId,
          data.type,
          data.exercises,
          data.workoutNotes,
          (data.date as Timestamp).toDate()
        );
      }
      return deleteDoc(doc.ref);
    });

    await Promise.all(migrationPromises);
    return snapshot.docs.length;
  }

  // Custom exercises operations
  static async saveCustomExercises(
    userId: string,
    workoutType: 'push' | 'pull',
    exercises: ExerciseDefinition[]
  ) {
    const customExercisesData = {
      userId,
      workoutType,
      exercises,
      lastUpdated: Timestamp.fromDate(new Date()),
    };

    const docRef = doc(db, 'users', userId, 'customExercises', workoutType);
    await setDoc(docRef, customExercisesData, { merge: true });
  }

  static async getCustomExercises(
    userId: string,
    workoutType: 'push' | 'pull'
  ): Promise<ExerciseDefinition[]> {
    const docRef = doc(db, 'users', userId, 'customExercises', workoutType);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().exercises || [];
    }

    return [];
  }

  // Delete operations
  static async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    const workoutRef = doc(db, 'users', userId, 'workouts', workoutId);
    await deleteDoc(workoutRef);
  }
}
