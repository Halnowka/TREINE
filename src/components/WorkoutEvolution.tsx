"use client";

import * as React from 'react';
import type { SavedWorkout, WeightEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, Line, LineChart } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseISO, format } from 'date-fns';
import { TrendingUp, BarChart, Scale } from 'lucide-react';
import { WeightHistory } from './WeightHistory';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

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

function WorkoutEvolutionTab({ savedWorkouts }: WorkoutEvolutionProps) {
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
  );
}

function WeightEvolutionTab() {
  const { user } = useAuth();
  const [weightHistory, setWeightHistory] = React.useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      fetchWeightHistory();
    }
  }, [user]);

  const fetchWeightHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Try new subcollection first
      try {
        const userWeightsCol = collection(db, 'users', user.uid, 'weights');
        const q = query(userWeightsCol, orderBy('date', 'desc'));
        const weightSnapshot = await getDocs(q);

        if (!weightSnapshot.empty) {
          const weights = weightSnapshot.docs.map(doc => ({
            id: doc.id,
            userId: user.uid,
            weight: doc.data().weight,
            date: (doc.data().date as Timestamp).toDate().toISOString(),
          })) as WeightEntry[];
          setWeightHistory(weights.reverse());
        } else {
          // Fallback to legacy collection
          const legacyWeightsCol = collection(db, 'weights');
          const legacyQ = query(
            legacyWeightsCol,
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
          );
          const legacySnapshot = await getDocs(legacyQ);
          const weights = legacySnapshot.docs.map(doc => ({
            id: doc.id,
            userId: doc.data().userId,
            weight: doc.data().weight,
            date: (doc.data().date as Timestamp).toDate().toISOString(),
          })) as WeightEntry[];
          setWeightHistory(weights.reverse());
        }
      } catch (error) {
        // Fallback to legacy collection
        const legacyWeightsCol = collection(db, 'weights');
        const legacyQ = query(
          legacyWeightsCol,
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        const legacySnapshot = await getDocs(legacyQ);
        const weights = legacySnapshot.docs.map(doc => ({
          id: doc.id,
          userId: doc.data().userId,
          weight: doc.data().weight,
          date: (doc.data().date as Timestamp).toDate().toISOString(),
        })) as WeightEntry[];
        setWeightHistory(weights.reverse());
      }
    } catch (error) {
      console.error('Error fetching weight history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const weightChartConfig = {
    weight: {
      label: "Weight (kg)",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const weightChartData = React.useMemo(() => {
    return weightHistory.map(entry => ({
      date: format(parseISO(entry.date), "d MMM"),
      weight: entry.weight,
      originalDate: parseISO(entry.date),
    })).sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());
  }, [weightHistory]);

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground border-border shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[250px]">
            <Scale className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground lowercase">loading weight evolution...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground border-border shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary lowercase">
          <Scale className="h-5 w-5" />
          weight evolution
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {weightChartData.length > 1 ? (
          <div className="h-[250px] w-full">
            <ChartContainer config={weightChartConfig}>
              <LineChart
                accessibilityLayer
                data={weightChartData}
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
                      formatter={(value) => [`${value} kg`, 'Weight']}
                  />}
                />
                <Line
                  dataKey="weight"
                  type="monotone"
                  stroke="var(--color-weight)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-weight)", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-center bg-muted/50 rounded-lg">
              <Scale className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground lowercase">
                {weightChartData.length === 0
                  ? "no weight data available."
                  : "you need at least two weight entries to see the evolution chart."
                }
              </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkoutEvolution({ savedWorkouts }: WorkoutEvolutionProps) {
  const hasWorkouts = savedWorkouts.length > 0;
  const hasExercises = React.useMemo(() => {
    const exerciseSet = new Set<string>();
    savedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exerciseSet.add(exercise.exerciseName);
      });
    });
    return exerciseSet.size > 0;
  }, [savedWorkouts]);

  if (!hasWorkouts && !hasExercises) {
    return (
      <div className="space-y-6">
        <WeightEvolutionTab />
        <WeightHistory />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="workouts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workouts" className="lowercase">workout evolution</TabsTrigger>
          <TabsTrigger value="weight" className="lowercase">weight evolution</TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="space-y-6">
          <WorkoutEvolutionTab savedWorkouts={savedWorkouts} />
        </TabsContent>

        <TabsContent value="weight" className="space-y-6">
          <WeightEvolutionTab />
        </TabsContent>
      </Tabs>

      <WeightHistory />
    </div>
  );
}
