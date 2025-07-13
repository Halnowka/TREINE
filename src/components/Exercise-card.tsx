
"use client";

import { useState } from 'react';
import type { ExerciseLogEntry, SetData } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { X } from 'lucide-react';
import { QuickSetLoggerDialog } from './QuickSetLoggerDialog';

interface ExerciseCardProps {
  exerciseLog: ExerciseLogEntry;
  onUpdateExerciseLog: (updatedLog: ExerciseLogEntry) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
}

export function ExerciseCard({ exerciseLog, onUpdateExerciseLog, onDeleteSet }: ExerciseCardProps) {
  const [isQuickSetLoggerOpen, setIsQuickSetLoggerOpen] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string>("");

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

  return (
    <Card className="relative bg-card text-card-foreground border-border shadow-md transition-all hover:shadow-lg">
      <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-primary/50" />
      <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-primary/50" />
      <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-primary/50" />
      <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-primary/50" />

      <CardHeader className="px-4 pt-7 pb-2 relative">
        <div className="flex justify-between items-center w-full">
            <div className="text-lg font-headline text-primary lowercase truncate">
              {exerciseLog.exerciseName}
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
    </Card>
  );
}
