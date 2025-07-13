
export type WorkoutType = 'push' | 'pull';

export type SetData = {
  id: string; // unique id for the set
  reps: number;
  weight?: number; // Optional, though likely not used for calisthenics, kept for flexibility
};

export type ExerciseLogEntry = {
  exerciseId: string;
  exerciseName: string;
  sets: SetData[];
};

export type CurrentWorkout = {
  type: WorkoutType | null;
  exercises: ExerciseLogEntry[];
  workoutNotes?: string; // General notes for the entire workout
};

export type SavedWorkout = {
  id: string; // unique id for the workout session
  date: string; // ISO string
  type: WorkoutType;
  exercises: ExerciseLogEntry[];
  workoutNotes?: string; // General notes for the entire workout
};

// For predefined exercise list
export type ExerciseDefinition = {
  id: string;
  name: string;
};

// For rest timers
export type TimerType = 'max' | 'sub-max' | 'ladder';
