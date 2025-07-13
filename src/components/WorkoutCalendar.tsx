"use client";

import * as React from 'react';
import type { SavedWorkout } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { parseISO, startOfDay } from 'date-fns';
import type { DayClickEventHandler } from 'react-day-picker';

interface WorkoutCalendarProps {
  savedWorkouts: SavedWorkout[];
  restDays: Date[];
  onDayClick: DayClickEventHandler;
}

export function WorkoutCalendar({ savedWorkouts, restDays, onDayClick }: WorkoutCalendarProps) {
  const [month, setMonth] = React.useState(new Date());

  const workoutDays = React.useMemo(() => {
    const pushDays: Date[] = [];
    const pullDays: Date[] = [];

    const markedDates = new Set<string>();

    for (let i = savedWorkouts.length - 1; i >= 0; i--) {
        const workout = savedWorkouts[i];
        const workoutDate = startOfDay(parseISO(workout.date));
        const dateString = workoutDate.toDateString();

        if (!markedDates.has(dateString)) {
            if (workout.type === 'push') {
                pushDays.push(workoutDate);
            } else if (workout.type === 'pull') {
                pullDays.push(workoutDate);
            }
            markedDates.add(dateString);
        }
    }
    
    return { push: pushDays, pull: pullDays };
  }, [savedWorkouts]);

  if (savedWorkouts.length < 1 && restDays.length < 1) {
    return null;
  }

  return (
    <div>
        <Card className="bg-card text-card-foreground border-border shadow-md">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
            <Calendar
                month={month}
                onMonthChange={setMonth}
                onDayClick={onDayClick}
                modifiers={{
                push: workoutDays.push,
                pull: workoutDays.pull,
                rest: restDays.map(d => startOfDay(d)),
                }}
                modifiersClassNames={{
                push: 'day-push',
                pull: 'day-pull',
                rest: 'day-rest'
                }}
                className="rounded-md border"
            />
            <div className="flex flex-row md:flex-col gap-4 self-center">
                <h4 className="text-lg font-semibold text-primary lowercase sr-only md:not-sr-only">legend</h4>
                <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-sm bg-[hsl(220_70%_50%_/_0.2)] border border-[hsl(220_90%_80%)]" />
                <span className="text-sm text-muted-foreground lowercase">push day</span>
                </div>
                <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-sm bg-[hsl(40_80%_55%_/_0.2)] border border-[hsl(40_90%_80%)]" />
                <span className="text-sm text-muted-foreground lowercase">pull day</span>
                </div>
                <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-sm bg-[hsl(var(--muted)_/_0.5)] border border-[hsl(var(--muted-foreground))]" />
                <span className="text-sm text-muted-foreground lowercase">rest day</span>
                </div>
            </div>
            </CardContent>
        </Card>
    </div>
  );
}
