
import { z } from 'zod';

// Validation schemas
export const WorkoutTypeSchema = z.enum(['push', 'pull', 'russian']);
export const TimerTypeSchema = z.enum(['max', 'sub-max', 'ladder']);

export const SetDataSchema = z.object({
  id: z.string(),
  reps: z.number().int().min(1).max(1000),
  weight: z.number().min(0).max(1000).optional(),
});

export const ExerciseLogEntrySchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  sets: z.array(SetDataSchema),
});

export const CurrentWorkoutSchema = z.object({
  type: WorkoutTypeSchema.nullable(),
  exercises: z.array(ExerciseLogEntrySchema),
  workoutNotes: z.string().optional(),
});

export const SavedWorkoutSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO string
  type: WorkoutTypeSchema,
  exercises: z.array(ExerciseLogEntrySchema),
  workoutNotes: z.string().optional(),
});

export const ExerciseDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const WeightEntrySchema = z.object({
  id: z.string(),
  weight: z.number().min(0.1).max(500),
  date: z.string(), // ISO string
  userId: z.string(),
});

export const UserProfileSchema = z.object({
  userId: z.string(),
  username: z.string(),
  currentWeight: z.number().min(0.1).max(500).optional(),
  weightHistory: z.array(WeightEntrySchema).optional(),
  russianProgramCompleted: z.array(z.number().int().min(1).max(40)).optional(),
  lastUpdated: z.string().optional(),
});

// Firestore document schemas
export const FirestoreWeightEntrySchema = z.object({
  userId: z.string(),
  weight: z.number().min(0.1).max(500),
  date: z.any(), // Firestore Timestamp
});

export const FirestoreWorkoutSchema = z.object({
  userId: z.string(),
  type: WorkoutTypeSchema,
  exercises: z.array(ExerciseLogEntrySchema),
  workoutNotes: z.string().optional(),
  date: z.any(), // Firestore Timestamp
});

export const FirestoreUserProgressSchema = z.object({
  userId: z.string(),
  russianProgramCompleted: z.array(z.number().int().min(1).max(40)).optional(),
  lastUpdated: z.any().optional(), // Firestore Timestamp
});

// Type exports
export type WorkoutType = z.infer<typeof WorkoutTypeSchema>;
export type TimerType = z.infer<typeof TimerTypeSchema>;
export type SetData = z.infer<typeof SetDataSchema>;
export type ExerciseLogEntry = z.infer<typeof ExerciseLogEntrySchema>;
export type CurrentWorkout = z.infer<typeof CurrentWorkoutSchema>;
export type SavedWorkout = z.infer<typeof SavedWorkoutSchema>;
export type ExerciseDefinition = z.infer<typeof ExerciseDefinitionSchema>;
export type WeightEntry = z.infer<typeof WeightEntrySchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
