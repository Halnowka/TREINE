
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { WorkoutType, ExerciseLogEntry, SavedWorkout, CurrentWorkout, ExerciseDefinition, SetData, TimerType } from '@/types';
import { PUSH_DAY_EXERCISES, PULL_DAY_EXERCISES } from '@/lib/exercises';
import { RUSSIAN_FIGHTER_PULLUP_PROGRAM } from '@/lib/russian-program';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { ExerciseCard } from '@/components/ExerciseCard';
import { useToast } from "@/hooks/use-toast";
import { Save, AlertTriangle, Info, Wand2, Plus, Loader2, BarChart, Orbit, CalendarCheck2, TrendingUp, Dumbbell, Menu, Repeat, Coffee, CheckSquare, Check, LogOut } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { doc, updateDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { isSameDay, parseISO, startOfDay } from 'date-fns';
import { AddExerciseDialog } from '@/components/AddExerciseDialog';
import dynamic from 'next/dynamic';
import { WorkoutDayToggle } from '@/components/WorkoutDayToggle';
import { RestTimer } from '@/components/RestTimer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from '@/components/Login';
import { DatabaseService } from '@/lib/database';


const WORKOUTS_PER_PAGE = 5;

const WorkoutHistory = dynamic(() => 
  import('@/components/WorkoutHistory').then(mod => mod.WorkoutHistory), 
  { 
    loading: () => (
      <div className="mt-10 text-center">
        <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
        <h3 className="text-2xl font-headline text-primary mb-2 lowercase">loading history...</h3>
        <p className="text-muted-foreground lowercase">fetching your saved workouts.</p>
      </div>
    ),
    ssr: false 
  }
);

const WorkoutEvolution = dynamic(() =>
  import('@/components/WorkoutEvolution').then(mod => mod.WorkoutEvolution),
  {
    loading: () => (
      <div className="mt-10">
        <div className="flex flex-col items-center justify-center h-[342px] text-center bg-card">
            <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground lowercase">
              loading chart...
            </p>
        </div>
      </div>
    ),
    ssr: false
  }
);

const WorkoutCalendar = dynamic(() =>
  import('@/components/WorkoutCalendar').then(mod => mod.WorkoutCalendar),
  {
    loading: () => (
      <div className="mt-10 text-center">
        <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
        <h3 className="text-2xl font-headline text-primary mb-2 lowercase">loading calendar...</h3>
        <p className="text-muted-foreground lowercase">fetching your workout calendar.</p>
      </div>
    ),
    ssr: false
  }
);

const LOCAL_STORAGE_KEY_CURRENT_WORKOUT = 'kineticTrackerCurrentWorkout';
const LOCAL_STORAGE_KEY_REST_DAYS = 'kineticTrackerRestDays';
const LOCAL_STORAGE_KEY_RUSSIAN_PROGRAM_COMPLETED = 'kineticTrackerRussianProgramCompleted';


type View = 'workout' | 'history' | 'calendar' | 'evolution';

export default function HomePage() {
  const { user, username, loading, logout } = useAuth();
  const [activeView, setActiveView] = useState<View>('workout');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<CurrentWorkout>({ type: null, exercises: [], workoutNotes: '' });
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [restDays, setRestDays] = useState<Date[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isAddExerciseDialogOpen, setIsAddExerciseDialogOpen] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hamburgerPosition, setHamburgerPosition] = useState({ top: 0, right: 0 });
  const [xRotated, setXRotated] = useState(false);

  // Russian Program State
  const [completedProgramDays, setCompletedProgramDays] = useState<number[]>([]);
  const [isLoadingRussianProgram, setIsLoadingRussianProgram] = useState(false);


  const { toast } = useToast();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Pequeno delay para permitir que o X apareça e depois rotacione
      setTimeout(() => setXRotated(true), 10);
    } else {
      document.body.style.overflow = '';
      setXRotated(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsClient(true);
    const storedCurrentWorkout = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_WORKOUT);
    if (storedCurrentWorkout) {
      const parsedWorkout = JSON.parse(storedCurrentWorkout);
      if (!Array.isArray(parsedWorkout.exercises)) {
        parsedWorkout.exercises = [];
      }
      setCurrentWorkout(parsedWorkout);
    } else {
      setCurrentWorkout({ type: null, exercises: [], workoutNotes: '' });
    }
  
    const storedRestDays = localStorage.getItem(LOCAL_STORAGE_KEY_REST_DAYS);
    if (storedRestDays) {
      setRestDays(JSON.parse(storedRestDays).map((dateString: string) => new Date(dateString)));
    }
  
    const storedCompletedDays = localStorage.getItem(LOCAL_STORAGE_KEY_RUSSIAN_PROGRAM_COMPLETED);
    if (storedCompletedDays) {
      setCompletedProgramDays(JSON.parse(storedCompletedDays));
    }

    if (user) {
      const fetchInitialWorkouts = async () => {
        setIsLoadingHistory(true);
        setHasMore(true);
        try {
          const result = await DatabaseService.getWorkoutHistory(user.uid, WORKOUTS_PER_PAGE);
          setSavedWorkouts(result.workouts);
          setLastVisibleDoc(result.lastDoc);
          setHasMore(result.hasMore);
        } catch (error) {
          console.error("error fetching workouts: ", error);
          toast({ title: "error fetching workouts", description: "could not load workout history from the database.", variant: "destructive" });
        }
        setIsLoadingHistory(false);
      };

      const fetchUserProgress = async () => {
        setIsLoadingRussianProgram(true);
        try {
          const progress = await DatabaseService.getUserProgress(user.uid);
          setCompletedProgramDays(progress.russianProgramCompleted);
        } catch (error) {
          console.error("error fetching user progress: ", error);
          // Don't show error toast for user progress as it's not critical
        }
        setIsLoadingRussianProgram(false);
      };

      fetchInitialWorkouts();
      fetchUserProgress();
    }

  }, [toast, user]);
  
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY_REST_DAYS, JSON.stringify(restDays));
    }
  }, [restDays, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY_RUSSIAN_PROGRAM_COMPLETED, JSON.stringify(completedProgramDays));
    }
  }, [completedProgramDays, isClient]);

  const handleLoadMore = useCallback(async () => {
    if (!user || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const result = await DatabaseService.getWorkoutHistory(user.uid, WORKOUTS_PER_PAGE, lastVisibleDoc || undefined);
      setSavedWorkouts(prev => [...prev, ...result.workouts]);
      setLastVisibleDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading more workouts: ", error);
      toast({ title: "Error loading more", description: "Could not fetch older workouts.", variant: "destructive"});
    }
    setIsLoadingMore(false);
  }, [user, lastVisibleDoc, hasMore, toast]);


   useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_WORKOUT, JSON.stringify(currentWorkout));
    }
  }, [currentWorkout, isClient]);

  const handleSelectDay = useCallback((newDay: WorkoutType) => {
    if (newDay === 'russian') {
      setCurrentWorkout({ type: 'russian', exercises: [], workoutNotes: '' });
      return;
    }
    
    const isSameDay = currentWorkout.type === newDay;
    const hasExistingProgress =
      currentWorkout.exercises.some(ex => ex.sets.length > 0) ||
      (currentWorkout.workoutNotes && currentWorkout.workoutNotes.trim() !== '');

    if (!isSameDay && hasExistingProgress) {
      if (!confirm("you have unsaved progress (sets or notes). changing workout type will clear it. continue?")) {
        return; 
      }
    }

    const exercisesForDay: ExerciseDefinition[] = newDay === 'push' ? PUSH_DAY_EXERCISES : PULL_DAY_EXERCISES;
    
    if (!isSameDay) {
        setCurrentWorkout({
          type: newDay,
          exercises: exercisesForDay.map(ex => ({
            exerciseId: ex.id,
            exerciseName: ex.name,
            sets: [], 
          })),
          workoutNotes: '',
        });
        toast({ title: "workout started", description: `selected ${newDay} day. let's go!` });
    } else { 
        const existingProgress = new Map<string, ExerciseLogEntry>();
        currentWorkout.exercises.forEach(ex => {
            existingProgress.set(ex.exerciseId, ex);
        });

        const newBaseExercises = exercisesForDay.map(exDef => 
            existingProgress.get(exDef.id) || { exerciseId: exDef.id, exerciseName: exDef.name, sets: [] }
        );

        const customExercises = currentWorkout.exercises.filter(ex => ex.exerciseId.startsWith('custom-'));
        
        setCurrentWorkout(prev => ({
            ...prev,
            type: newDay,
            exercises: [...newBaseExercises, ...customExercises],
        }));
    }
  }, [currentWorkout, toast]);


  const handleUpdateExerciseLog = useCallback((updatedLog: ExerciseLogEntry) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.exerciseId === updatedLog.exerciseId ? updatedLog : ex
      ),
    }));
  }, []);
  
  const handleDeleteSet = useCallback((exerciseId: string, setId: string) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.exerciseId === exerciseId
          ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
          : ex
      ),
    }));
    toast({ title: "set deleted", variant: "destructive" });
  }, [toast]);

  const handleWorkoutNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentWorkout(prev => ({
        ...prev,
        workoutNotes: e.target.value,
    }));
  };

  const handleSaveWorkout = useCallback(async () => {
    if (!user) {
      console.log('No user authenticated');
      return;
    }

    if (!currentWorkout.type || (currentWorkout.exercises.every(ex => ex.sets.length === 0) && (!currentWorkout.workoutNotes || currentWorkout.workoutNotes.trim() === ''))) {
      toast({
        title: "cannot save workout",
        description: "please select a workout type and log at least one set or add workout notes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const workoutId = await DatabaseService.saveWorkout(
        user.uid,
        currentWorkout.type,
        currentWorkout.exercises,
        currentWorkout.workoutNotes || ''
      );

      // Refresh the workouts list
      const result = await DatabaseService.getWorkoutHistory(user.uid, WORKOUTS_PER_PAGE);
      setSavedWorkouts(result.workouts);
      setLastVisibleDoc(result.lastDoc);
      setHasMore(result.hasMore);

      setCurrentWorkout({ type: null, exercises: [], workoutNotes: '' });
      if (isClient) {
        localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_WORKOUT);
      }

      toast({
        title: "workout saved!",
        description: `your ${currentWorkout.type} workout was successfully saved to the database.`,
      });
    } catch (error) {
      console.error("error saving workout: ", error);
      const errorDetails = error as any;
      console.error('Error details:', {
        code: errorDetails?.code,
        message: errorDetails?.message,
        stack: errorDetails?.stack
      });
      toast({
        title: "error saving workout",
        description: `Error: ${errorDetails?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }, [currentWorkout, toast, isClient, user]);

  const handleDeleteWorkout = useCallback(async (workoutId: string) => {
    if (!user) return;

    try {
      await DatabaseService.deleteWorkout(user.uid, workoutId);

      // Refresh the workouts list
      const result = await DatabaseService.getWorkoutHistory(user.uid, WORKOUTS_PER_PAGE);
      setSavedWorkouts(result.workouts);
      setLastVisibleDoc(result.lastDoc);
      setHasMore(result.hasMore);

      toast({ title: "workout deleted", description: "the workout has been removed from your history.", variant: "destructive" });
    } catch (error) {
      console.error("error deleting workout: ", error);
      toast({ title: "error deleting workout", description: "could not delete workout from the database.", variant: "destructive"});
    }
  }, [user, toast]);
  
  const handleUpdateWorkoutNotes = useCallback(async (workoutId: string, newNotes: string) => {
    if (!user) return;

    try {
      // For now, update locally since we don't have an update method in DatabaseService yet
      // This will be refreshed when the workouts are reloaded
      setSavedWorkouts(prev => prev.map(w =>
        w.id === workoutId ? { ...w, workoutNotes: newNotes } : w
      ));
      toast({ title: "notes updated", description: "your workout notes have been successfully updated." });
    } catch (error) {
      console.error("error updating notes: ", error);
      toast({ title: "error updating notes", description: "could not update notes in the database.", variant: "destructive"});
    }
  }, [user, toast]);

  const handleAddCustomExercise = useCallback((exerciseName: string) => {
    if (!currentWorkout.type || currentWorkout.type === 'russian') {
        toast({ title: "select a push/pull workout day first", variant: "destructive"});
        return;
    }
    const newExercise: ExerciseLogEntry = {
      exerciseId: `custom-${exerciseName.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID()}`,
      exerciseName: exerciseName,
      sets: [],
    };

    setCurrentWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }));

    toast({
      title: "exercise added",
      description: `"${exerciseName}" has been added to your workout.`,
    });
  }, [toast, currentWorkout.type]);

  const handleToggleRestDay = useCallback((day: Date) => {
    const dayStart = startOfDay(day);

    const isWorkoutDay = savedWorkouts.some(workout => 
      isSameDay(parseISO(workout.date), dayStart)
    );

    if (isWorkoutDay) {
      toast({
        title: "workout day",
        description: "this day is already logged as a workout and cannot be a rest day.",
        variant: "default"
      });
      return;
    }

    setRestDays(prevRestDays => {
      const isRestDay = prevRestDays.some(restDay => isSameDay(restDay, dayStart));
      if (isRestDay) {
        return prevRestDays.filter(restDay => !isSameDay(restDay, dayStart));
      } else {
        return [...prevRestDays, dayStart];
      }
    });
  }, [savedWorkouts, toast]);
  
  const handleNavigationClick = (view: View) => {
    setActiveView(view);
    setIsMenuOpen(false);
  };
  
  const handleToggleProgramDay = useCallback(async (day: number) => {
    if (!user) return;

    const newCompletedDays = completedProgramDays.includes(day)
      ? completedProgramDays.filter(d => d !== day)
      : [...completedProgramDays, day].sort((a,b) => a-b);

    setCompletedProgramDays(newCompletedDays);

    try {
      await DatabaseService.saveUserProgress(user.uid, newCompletedDays);
      console.log("Successfully saved russian program progress");
    } catch (error: any) {
      console.error("Error saving russian program progress: ", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      // Revert the change if save failed
      setCompletedProgramDays(completedProgramDays);
      toast({
        title: "error saving progress",
        description: `could not save your russian program progress to the database. Error: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [user, completedProgramDays, toast]);

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'workout', label: 'workout', icon: <Dumbbell className="h-6 w-6" /> },
    { id: 'history', label: 'history', icon: <Orbit className="h-6 w-6" /> },
    { id: 'calendar', label: 'calendar', icon: <CalendarCheck2 className="h-6 w-6" /> },
    { id: 'evolution', label: 'evolution', icon: <TrendingUp className="h-6 w-6" /> },
  ];

  const renderRussianProgramView = () => (
    <div className="max-w-2xl mx-auto my-8">
      <Card className="bg-card shadow-lg border-primary">
          <CardHeader>
              <CardTitle className="font-headline text-primary text-2xl lowercase flex items-center">
                  <Repeat className="mr-3 h-6 w-6" />
                  russian fighter pull-up program
              </CardTitle>
          </CardHeader>
          <CardContent>
              <Accordion type="single" collapsible className="w-full">
                  {RUSSIAN_FIGHTER_PULLUP_PROGRAM.map((workout, index) => {
                      const dayNumber = index + 1;
                      const isCompleted = completedProgramDays.includes(dayNumber);

                      return (
                          <AccordionItem key={dayNumber} value={`day-${dayNumber}`} className="border-border">
                              <AccordionTrigger className={cn(
                                "text-lg lowercase font-semibold hover:no-underline px-4 py-3 rounded-md transition-colors",
                                isCompleted ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-muted/50"
                              )}>
                                  <div className="flex items-center gap-4">
                                      <span className={cn(
                                          "flex items-center justify-center h-6 w-6 rounded-full text-xs",
                                          isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                      )}>
                                          {isCompleted ? <Check className="h-4 w-4" /> : dayNumber}
                                      </span>
                                      day {dayNumber}
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 py-3">
                                  {workout ? (
                                      <div className="flex flex-col items-start gap-4">
                                          <div>
                                              <p className="text-muted-foreground lowercase mb-2">your sets for today are:</p>
                                              <div className="flex justify-start items-center gap-4">
                                                  {workout.map((reps, i) => (
                                                      <div key={i} className="flex flex-col items-center">
                                                          <span className="text-xs text-muted-foreground lowercase">set {i + 1}</span>
                                                          <span className="text-3xl font-bold text-accent">{reps}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                          <Button onClick={() => handleToggleProgramDay(dayNumber)} size="sm" variant={isCompleted ? "destructive" : "default"} className="lowercase">
                                              {isCompleted ? 'un-mark day' : 'complete day'}
                                          </Button>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-3">
                                          <Coffee className="h-6 w-6 text-primary" />
                                          <p className="text-lg text-primary lowercase">today is a rest day.</p>
                                      </div>
                                  )}
                              </AccordionContent>
                          </AccordionItem>
                      )
                  })}
              </Accordion>
          </CardContent>
      </Card>
    </div>
  );


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 md:p-8">
        <p className="text-xl text-primary lowercase">loading treine...</p>
        <p className="text-md text-muted-foreground lowercase">authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 md:p-8">
        <Header onMenuToggle={() => {}} onCatClick={() => {}} isMenuOpen={false} onPositionChange={() => {}} />
        <p className="text-xl text-primary lowercase">loading treine...</p>
        <p className="text-md text-muted-foreground lowercase">accessing workout history...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="relative flex flex-col min-h-screen p-4 md:p-8 selection:bg-primary selection:text-primary-foreground">
        <Header
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          onCatClick={() => setIsRestTimerOpen(true)}
          isMenuOpen={isMenuOpen}
          onPositionChange={setHamburgerPosition}
        />
        
        {isMenuOpen && hamburgerPosition.top > 0 && (
            <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-center">
                <button
                    onClick={() => setIsMenuOpen(false)}
                    style={{ position: 'absolute', top: `${hamburgerPosition.top}px`, right: `${window.innerWidth - hamburgerPosition.right}px` }}
                    className={`z-50 p-2 text-primary hover:text-accent x-rotate ${xRotated ? 'rotated' : ''}`}
                    aria-label="close menu"
                >
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <nav className="flex flex-col gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigationClick(item.id)}
                            className="flex items-center gap-4 text-4xl font-headline text-primary lowercase hover:text-accent transition-colors transform hover:scale-105"
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={logout}
                        className="flex items-center gap-4 text-4xl font-headline text-destructive lowercase hover:text-red-400 transition-colors transform hover:scale-105 mt-8"
                    >
                        <LogOut className="h-8 w-8" />
                        <span>logout</span>
                    </button>
                </nav>
            </div>
        )}

        <div className={`${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity'}`}>
          <main className="mt-8">
            {activeView === 'workout' && (
              <>
                <WorkoutDayToggle selectedDay={currentWorkout.type} onSelectDay={handleSelectDay} />
                
                {currentWorkout.type === 'russian' ? (
                  renderRussianProgramView()
                ) : (
                  <>
                    {!currentWorkout.type && (
                      <Alert className="my-8 border-accent bg-card shadow-md">
                        <Info className="h-5 w-5 text-accent" />
                        <AlertTitle className="font-headline text-accent text-xl lowercase">welcome to treine!</AlertTitle>
                        <AlertDescription className="text-muted-foreground text-base lowercase">
                          select a program above to start logging your exercises. your progress will be saved to the cloud!
                        </AlertDescription>
                      </Alert>
                    )}
  
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 mb-10">
                      {currentWorkout.exercises.map(exerciseLog => (
                        <ExerciseCard
                          key={exerciseLog.exerciseId}
                          exerciseLog={exerciseLog}
                          onUpdateExerciseLog={handleUpdateExerciseLog}
                          onDeleteSet={handleDeleteSet}
                        />
                      ))}
                      {currentWorkout.type && (
                          <div className="flex items-center justify-center">
                              <button
                              onClick={() => setIsAddExerciseDialogOpen(true)}
                              className="text-muted-foreground/70 hover:text-primary transition-colors"
                              aria-label="add custom exercise"
                              >
                              <Plus className="h-10 w-10" />
                              </button>
                          </div>
                      )}
                    </div>
                    
                    {currentWorkout.type && currentWorkout.exercises.length === 0 && (
                        <Alert variant="destructive" className="my-8">
                          <AlertTriangle className="h-5 w-5" />
                          <AlertTitle className="font-headline lowercase">no exercises loaded</AlertTitle>
                          <AlertDescription className="lowercase">
                            there might be an issue loading exercises for {currentWorkout.type} day. please try selecting the day again.
                          </AlertDescription>
                        </Alert>
                    )}
  
                    {currentWorkout.type && (
                      <div className="my-6 space-y-6">
                        <div className="max-w-xl mx-auto">
                          <Label htmlFor="workoutNotes" className="text-lg font-semibold text-primary mb-2 flex items-center lowercase">
                            <Wand2 className="mr-2 h-5 w-5" />
                            workout notes ({currentWorkout.type} day)
                          </Label>
                          <Textarea
                            id="workoutNotes"
                            placeholder="add general notes for this workout (e.g., how you felt, overall rpe, etc.)..."
                            value={currentWorkout.workoutNotes || ''}
                            onChange={handleWorkoutNotesChange}
                            className="min-h-[100px] text-base bg-card border-border shadow-sm"
                          />
                        </div>
                        <div className="text-center">
                          <Button 
                            onClick={handleSaveWorkout} 
                            size="lg" 
                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-lg transition-transform transform hover:scale-105 lowercase"
                            disabled={currentWorkout.exercises.every(ex => ex.sets.length === 0) && (!currentWorkout.workoutNotes || currentWorkout.workoutNotes.trim() === '')}
                          >
                            <Save className="mr-2 h-6 w-6" /> save current workout
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeView === 'history' && (
              <div id="workout-history" className="mt-6">
                <h2 className="text-3xl font-headline text-primary mb-6 flex w-full justify-center items-center p-2 lowercase">
                  <Orbit className="mr-3 h-8 w-8" />
                  workout history
                </h2>
                <WorkoutHistory 
                  savedWorkouts={savedWorkouts} 
                  onDeleteWorkout={handleDeleteWorkout} 
                  onUpdateWorkoutNotes={handleUpdateWorkoutNotes}
                  isLoading={isLoadingHistory}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                />
              </div>
            )}

            {activeView === 'calendar' && (
              <div id="workout-calendar" className="mt-6">
                <h2 className="text-3xl font-headline text-primary mb-6 flex w-full justify-center items-center p-2 lowercase">
                  <CalendarCheck2 className="mr-3 h-8 w-8" />
                  workout calendar
                </h2>
                <WorkoutCalendar 
                  savedWorkouts={savedWorkouts} 
                  restDays={restDays}
                  onDayClick={(day) => handleToggleRestDay(day)}
                />
              </div>
            )}
            
            {activeView === 'evolution' && (
              <div id="workout-evolution" className="mt-6">
                <h2 className="text-3xl font-headline text-primary mb-6 flex w-full justify-center items-center p-2 lowercase">
                  <TrendingUp className="mr-3 h-8 w-8" />
                  workout evolution
                </h2>
                <WorkoutEvolution savedWorkouts={savedWorkouts} />
              </div>
            )}
          </main>
          
          <footer className="text-center mt-12 py-6 border-t border-border">
            <p className="text-sm text-muted-foreground lowercase">&copy; {new Date().getFullYear()} treine. keep pushing, keep pulling!</p>
          </footer>
        </div>
        
        <AddExerciseDialog 
          isOpen={isAddExerciseDialogOpen}
          onOpenChange={setIsAddExerciseDialogOpen}
          onAddExercise={handleAddCustomExercise}
        />
        <RestTimer 
          isOpen={isRestTimerOpen}
          onOpenChange={setIsRestTimerOpen}
        />
      </div>
    </div>
  );
}
