
"use client";

import * as React from 'react';
import type { SavedWorkout } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, XCircle, Orbit, FileText, Loader2, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from './ui/textarea';

interface WorkoutHistoryProps {
  savedWorkouts: SavedWorkout[];
  onDeleteWorkout: (workoutId: string) => void;
  onUpdateWorkoutNotes: (workoutId: string, newNotes: string) => void;
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export function WorkoutHistory({ 
  savedWorkouts, 
  onDeleteWorkout, 
  onUpdateWorkoutNotes, 
  isLoading,
  onLoadMore,
  hasMore,
  isLoadingMore 
}: WorkoutHistoryProps) {
  const [activeWorkoutId, setActiveWorkoutId] = React.useState<string | null>(null);
  const [workoutToDeleteId, setWorkoutToDeleteId] = React.useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = React.useState<{ id: string; notes: string } | null>(null);

  const toggleWorkoutExpansion = (workoutId: string) => {
    if (editingWorkout?.id === workoutId) return; // Prevent collapsing while editing
    setActiveWorkoutId(prevId => (prevId === workoutId ? null : workoutId));
  };

  const handleDeleteConfirm = () => {
    if (workoutToDeleteId) {
      onDeleteWorkout(workoutToDeleteId);
    }
    setWorkoutToDeleteId(null); 
  };

  const openDeleteDialog = (workoutId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card from toggling expansion
    setWorkoutToDeleteId(workoutId);
  };
  
  const handleSaveNotes = () => {
    if (editingWorkout) {
        onUpdateWorkoutNotes(editingWorkout.id, editingWorkout.notes);
        setEditingWorkout(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-10 text-center">
        <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
        <h3 className="text-2xl font-headline text-primary mb-2 lowercase">loading history...</h3>
        <p className="text-muted-foreground lowercase">fetching your saved workouts.</p>
      </div>
    );
  }
  
  if (savedWorkouts.length === 0 && !isLoading) {
    return (
      <div className="mt-10 text-center">
        <Orbit className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-2xl font-headline text-primary mb-2 lowercase">workout history empty</h3>
        <p className="text-muted-foreground lowercase">no workouts saved yet. complete a session and save it to see it here!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {savedWorkouts.map((workout) => {
          const isExpanded = activeWorkoutId === workout.id;
          return (
            <Card key={workout.id} className="bg-card text-card-foreground border-border shadow-md overflow-hidden">
              <CardHeader className="p-4 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => toggleWorkoutExpansion(workout.id)}>
                <div className="flex justify-between items-center">
                  <div className="flex-grow">
                    <CardTitle className="text-2xl font-headline text-primary flex items-center lowercase">
                      <Orbit className="mr-2 h-6 w-6" />
                      {workout.type} day workout
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground flex items-center mt-1 lowercase">
                      <CalendarClock className="mr-2 h-4 w-4" />
                      {format(parseISO(workout.date), "MMMM d, yyyy 'at' h:mm a")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    { (workout.workoutNotes && workout.workoutNotes.trim() !== "" || workout.exercises.length > 0) && (
                        isExpanded ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-primary" />
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                            onClick={(e) => openDeleteDialog(workout.id, e)}
                            className="p-1 text-destructive hover:text-red-400 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="delete workout"
                        >
                            <XCircle className="h-5 w-5" />
                        </button>
                      </AlertDialogTrigger>
                      {workoutToDeleteId === workout.id && (
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="lowercase">are you sure?</AlertDialogTitle>
                            <AlertDialogDescription className="lowercase">
                              this action cannot be undone. this will permanently delete this workout session.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setWorkoutToDeleteId(null)} className="lowercase">cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm} className="lowercase bg-destructive text-destructive-foreground hover:bg-destructive/90">delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-2 pb-4 space-y-4">
                  <div className="p-3 bg-muted/30 border border-border/30">
                      <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-accent text-md flex items-center lowercase">
                              <FileText className="mr-2 h-5 w-5" />
                              workout notes
                          </h4>
                          {editingWorkout?.id !== workout.id && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setEditingWorkout({ id: workout.id, notes: workout.workoutNotes || '' })}>
                                  <Wand2 className="h-4 w-4" />
                              </Button>
                          )}
                      </div>
                      
                      {editingWorkout?.id === workout.id ? (
                          <div className="space-y-2 mt-2">
                              <Textarea
                                  placeholder="add or edit your notes..."
                                  value={editingWorkout.notes}
                                  onChange={(e) => setEditingWorkout(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                  className="min-h-[100px] text-base bg-card border-input"
                              />
                              <div className="flex justify-end gap-2">
                                  <Button variant="ghost" onClick={() => setEditingWorkout(null)} className="lowercase">cancel</Button>
                                  <Button onClick={handleSaveNotes} className="lowercase">save</Button>
                              </div>
                          </div>
                      ) : (
                          (workout.workoutNotes && workout.workoutNotes.trim() !== "") ? (
                               <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{workout.workoutNotes}</p>
                          ) : (
                              <p className="text-sm text-muted-foreground italic mt-2">no notes recorded.</p>
                          )
                      )}
                  </div>

                  {workout.exercises.length > 0 && (
                    <div>
                      <ul className="space-y-3">
                        {workout.exercises.map((exerciseLog) => {
                          const totalReps = exerciseLog.sets.reduce((sum, set) => sum + set.reps, 0);
                          return (
                            <li key={exerciseLog.exerciseId} className="p-3 bg-muted/50 border border-border/50">
                              <h5 className="font-semibold text-primary text-lg lowercase">{exerciseLog.exerciseName}</h5>
                              <ul className="space-y-1 mt-1 pl-4 list-disc list-inside text-sm lowercase">
                                {exerciseLog.sets.map((set, idx) => (
                                  <li key={set.id}>
                                    set {idx + 1}: {set.reps} reps
                                    {set.weight && ` at ${set.weight} kg`}
                                  </li>
                                ))}
                              </ul>
                              {totalReps > 0 && (
                                <p className="text-xs text-muted-foreground text-right mt-1 lowercase">
                                  total: {totalReps} reps
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
      {hasMore && (
        <div className="mt-6 text-center">
            <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="lowercase"
            >
                {isLoadingMore ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        loading...
                    </>
                ) : (
                    "load more"
                )}
            </Button>
        </div>
      )}
    </div>
  );
}
