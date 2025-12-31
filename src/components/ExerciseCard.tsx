
"use client";

import { useState } from 'react';
import type { ExerciseLogEntry, SetData, ExerciseDefinition } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { QuickSetLoggerDialog } from './QuickSetLoggerDialog';
import { DatabaseService } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ExerciseCardProps {
  exerciseLog: ExerciseLogEntry;
  onUpdateExerciseLog: (updatedLog: ExerciseLogEntry) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  onRenameExercise?: (exerciseId: string, newName: string) => void;
  workoutType?: 'push' | 'pull';
}

export function ExerciseCard({
  exerciseLog,
  onUpdateExerciseLog,
  onDeleteSet,
  onDeleteExercise,
  onRenameExercise,
  workoutType
}: ExerciseCardProps) {
  const [isQuickSetLoggerOpen, setIsQuickSetLoggerOpen] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string>("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState(exerciseLog.exerciseName);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogSet = (reps: number, weight?: number) => {
    const newSet: SetData = { id: crypto.randomUUID(), reps, weight };
    const updatedLog = {
      ...exerciseLog,
      sets: [...exerciseLog.sets, newSet],
    };
    onUpdateExerciseLog(updatedLog);
    setActiveAccordionItem("sets"); 
  };

  const toggleAccordion = () => {
    if (exerciseLog.sets.length > 0) {
      setActiveAccordionItem(prev => prev === "sets" ? "" : "sets");
    }
  };
  
  const setsContentId = `sets-content-${exerciseLog.exerciseId}`;
  const totalReps = exerciseLog.sets.reduce((sum, set) => sum + set.reps, 0);
  const isCustomExercise = exerciseLog.exerciseId.startsWith('custom-');

  const handleDeleteExercise = async () => {
    if (!user || !workoutType || !isCustomExercise) return;

    try {
      // Get existing custom exercises
      const existingCustomExercises = await DatabaseService.getCustomExercises(user.uid, workoutType);
      // Remove the exercise to delete
      const updatedCustomExercises = existingCustomExercises.filter(ex => ex.id !== exerciseLog.exerciseId);

      // Save updated list
      await DatabaseService.saveCustomExercises(user.uid, workoutType, updatedCustomExercises);

      // Call parent callback
      onDeleteExercise?.(exerciseLog.exerciseId);

      toast({
        title: "exercise deleted",
        description: `"${exerciseLog.exerciseName}" has been removed from your workout.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error("error deleting exercise: ", error);
      toast({
        title: "error deleting exercise",
        description: "could not delete the exercise from the database.",
        variant: "destructive",
      });
    }
  };

  const handleRenameExercise = async () => {
    if (!user || !workoutType || !isCustomExercise || !newExerciseName.trim()) return;

    try {
      // Get existing custom exercises
      const existingCustomExercises = await DatabaseService.getCustomExercises(user.uid, workoutType);
      // Update the exercise name
      const updatedCustomExercises = existingCustomExercises.map(ex =>
        ex.id === exerciseLog.exerciseId ? { ...ex, name: newExerciseName.trim() } : ex
      );

      // Save updated list
      await DatabaseService.saveCustomExercises(user.uid, workoutType, updatedCustomExercises);

      // Call parent callback
      onRenameExercise?.(exerciseLog.exerciseId, newExerciseName.trim());

      setIsRenameDialogOpen(false);
      toast({
        title: "exercise renamed",
        description: `exercise renamed to "${newExerciseName.trim()}".`,
      });
    } catch (error) {
      console.error("error renaming exercise: ", error);
      toast({
        title: "error renaming exercise",
        description: "could not rename the exercise in the database.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="relative bg-card text-card-foreground border-border shadow-md transition-all hover:shadow-lg">
      <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-primary/50" />
      <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-primary/50" />
      <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-primary/50" />
      <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-primary/50" />

      <CardHeader className="px-4 pt-7 pb-2 relative">
        <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-primary hover:text-accent-foreground cursor-pointer p-1 bg-transparent border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`exercise options for ${exerciseLog.exerciseName}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    rename exercise
                  </DropdownMenuItem>
                  {isCustomExercise && (
                    <DropdownMenuItem
                      onClick={handleDeleteExercise}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      delete exercise
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="text-lg font-headline text-primary lowercase truncate">
                {exerciseLog.exerciseName}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsQuickSetLoggerOpen(true)}
              className="text-primary hover:text-accent-foreground cursor-pointer text-lg lowercase p-0 bg-transparent border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`add set for ${exerciseLog.exerciseName}`}
            >
              add set
            </button>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={toggleAccordion}
              className="text-3xl font-bold text-primary cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring flex h-12 w-12 items-center justify-center"
              aria-expanded={activeAccordionItem === "sets"}
              aria-controls={setsContentId}
              disabled={exerciseLog.sets.length === 0}
              aria-label={`expand sets for ${exerciseLog.exerciseName}`}
            >
              {exerciseLog.sets.length}
            </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {exerciseLog.sets.length > 0 && (
          <Accordion 
            type="single" 
            collapsible 
            className="w-full" 
            value={activeAccordionItem} 
            onValueChange={setActiveAccordionItem}
          >
            <AccordionItem value="sets" className="border-none">
              <AccordionContent id={setsContentId} className="pt-2">
                <ul className="space-y-3">
                  {exerciseLog.sets.map((set, index) => (
                    <li key={set.id} className="p-3 bg-muted/50 border border-border/50 shadow-sm">
                      <div className="flex justify-between items-center">
                        <p className="text-base lowercase">
                          set {index + 1}: <span className="font-semibold text-primary">{set.reps} reps</span>
                          {set.weight && ` at ${set.weight} kg`}
                        </p>
                        <button
                          type="button" 
                          onClick={() => onDeleteSet(exerciseLog.exerciseId, set.id)} 
                          className="text-destructive hover:text-red-400 h-8 w-8 p-0 bg-transparent border-none flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                          aria-label={`delete set ${index + 1} for ${exerciseLog.exerciseName}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {totalReps > 0 && (
                  <p className="text-xs text-muted-foreground text-right mt-2 lowercase">
                    total: {totalReps} reps
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>

      <QuickSetLoggerDialog
        isOpen={isQuickSetLoggerOpen}
        onOpenChange={setIsQuickSetLoggerOpen}
        onLogSet={handleLogSet}
        exerciseName={exerciseLog.exerciseName}
      />

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="lowercase">rename exercise</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename-exercise" className="text-right lowercase">
                name
              </Label>
              <Input
                id="rename-exercise"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                className="col-span-3"
                placeholder="enter new exercise name"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRenameExercise}
              disabled={!newExerciseName.trim() || newExerciseName.trim() === exerciseLog.exerciseName}
              className="lowercase"
            >
              rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
