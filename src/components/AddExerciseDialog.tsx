"use client";

import { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface AddExerciseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddExercise: (exerciseName: string) => void;
}

export function AddExerciseDialog({ isOpen, onOpenChange, onAddExercise }: AddExerciseDialogProps) {
  const [exerciseName, setExerciseName] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (exerciseName.trim() === '') {
      toast({
        title: "exercise name required",
        description: "please enter a name for the custom exercise.",
        variant: "destructive",
      });
      return;
    }
    onAddExercise(exerciseName.trim());
    setExerciseName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="lowercase">add custom exercise</DialogTitle>
            <DialogDescription className="lowercase">
              enter the name of the new exercise you want to add to your current workout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="exercise-name" className="text-right lowercase">
                name
              </Label>
              <Input
                id="exercise-name"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Archer Push-ups"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="lowercase">
              <Plus className="mr-2 h-4 w-4" /> add exercise
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
