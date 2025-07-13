"use client";

import * as React from 'react';
import type { SavedWorkout } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { parseISO, format } from 'date-fns';
import { TrendingUp, BarChart } from 'lucide-react';

interface WorkoutEvolutionProps {
  savedWorkouts: SavedWorkout[];
}

type ChartData = {
  date: string;
  totalReps: number;
};

const chartConfig = {
  totalReps: {
    label: "Total Reps",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function WorkoutEvolution({ savedWorkouts }: WorkoutEvolutionProps) {
  const [selectedExercise, setSelectedExercise] = React.useState<string | null>(null);

  const uniqueExercises = React.useMemo(() => {
    const exerciseSet = new Set<string>();
    savedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exerciseSet.add(exercise.exerciseName);
      });
    });
    return Array.from(exerciseSet).sort();
  }, [savedWorkouts]);

  const evolutionData = React.useMemo(() => {
    if (!selectedExercise) return [];

    const repsByDay = savedWorkouts.reduce((acc: Record<string, number>, workout) => {
        const exerciseLog = workout.exercises.find(
            (ex) => ex.exerciseName === selectedExercise && ex.sets.length > 0
        );

        if (exerciseLog) {
            const totalReps = exerciseLog.sets.reduce((sum, set) => sum + set.reps, 0);
            const dayKey = format(parseISO(workout.date), "yyyy-MM-dd");
            
            acc[dayKey] = (acc[dayKey] || 0) + totalReps;
        }

        return acc;
    }, {});

    const chartData = Object.keys(repsByDay)
        .map((dayKey) => ({
            date: format(parseISO(dayKey), "d MMM"),
            totalReps: repsByDay[dayKey],
            originalDate: parseISO(dayKey),
        }))
        .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());

    return chartData.map(({ date, totalReps }) => ({ date, totalReps }));
}, [selectedExercise, savedWorkouts]);


  if (savedWorkouts.length === 0 || uniqueExercises.length === 0) {
    return null;
  }

  return (
    <div>
      <Card className="bg-card text-card-foreground border-border shadow-md">
        <CardContent className="p-6 space-y-6">
          <Select onValueChange={setSelectedExercise} value={selectedExercise ?? ''}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="select an exercise" />
            </SelectTrigger>
            <SelectContent>
              {uniqueExercises.map(ex => (
                <SelectItem key={ex} value={ex} className="lowercase">
                  {ex}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedExercise && evolutionData.length > 1 ? (
            <div className="h-[250px] w-full">
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={evolutionData}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        indicator="dot" 
                        formatter={(value) => [`${value} reps`, 'Total']}
                    />}
                  />
                  <Area
                    dataKey="totalReps"
                    type="natural"
                    fill="var(--color-totalReps)"
                    fillOpacity={0.4}
                    stroke="var(--color-totalReps)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-center bg-muted/50 rounded-lg">
                <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground lowercase">
                  {selectedExercise 
                    ? "you need at least two workouts with this exercise to see a chart."
                    : "select an exercise to start the analysis."
                  }
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
