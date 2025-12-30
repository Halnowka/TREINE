"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { WeightEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface WeightTrackerProps {
  onWeightUpdate?: (weight: number) => void;
}

export function WeightTracker({ onWeightUpdate }: WeightTrackerProps) {
  const { user } = useAuth();
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previousWeight, setPreviousWeight] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCurrentWeight();
    }
  }, [user]);

  const fetchCurrentWeight = async () => {
    if (!user) return;

    try {
      // Fetch weight history to get current and previous weights
      const weightsCol = collection(db, 'weights');
      const q = query(
        weightsCol,
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(2)
      );

      const weightSnapshot = await getDocs(q);
      if (!weightSnapshot.empty) {
        const weights = weightSnapshot.docs.map(doc => ({
          id: doc.id,
          userId: doc.data().userId,
          weight: doc.data().weight,
          date: (doc.data().date as Timestamp).toDate().toISOString(),
        })) as WeightEntry[];

        const latestWeight = weights[0];
        const secondLatestWeight = weights[1];

        setCurrentWeight(latestWeight.weight);
        if (secondLatestWeight) {
          setPreviousWeight(secondLatestWeight.weight);
        }
      }
    } catch (error) {
      console.error('Error fetching weight:', error);
      toast({
        title: "error loading weight",
        description: "could not load current weight from database.",
        variant: "destructive",
      });
    }
  };

  const handleAddWeight = async () => {
    if (!user || !newWeight.trim()) {
      console.log('No user or weight provided');
      return;
    }

    const weightValue = parseFloat(newWeight.trim());
    if (isNaN(weightValue) || weightValue <= 0 || weightValue > 500) {
      toast({
        title: "invalid weight",
        description: "please enter a valid weight between 0.1 and 500 kg.",
        variant: "destructive",
      });
      return;
    }

    console.log('Attempting to save weight:', weightValue, 'for user:', user.uid);
    setIsLoading(true);
    try {
      // Add to weights collection
      const weightEntry = {
        userId: user.uid,
        weight: weightValue,
        date: Timestamp.fromDate(new Date()),
      };

      console.log('Weight entry to save:', weightEntry);
      const docRef = await addDoc(collection(db, 'weights'), weightEntry);
      console.log('Weight saved successfully, doc ID:', docRef.id);

      // Update local state immediately
      setCurrentWeight(weightValue);
      setPreviousWeight(currentWeight);
      setNewWeight('');
      setIsDialogOpen(false);

      onWeightUpdate?.(weightValue);

      toast({
        title: "weight updated!",
        description: `your current weight is now ${weightValue} kg.`,
      });
    } catch (error) {
      console.error('Error saving weight:', error);
      const errorDetails = error as any;
      console.error('Error details:', {
        code: errorDetails?.code,
        message: errorDetails?.message,
        stack: errorDetails?.stack
      });
      toast({
        title: "error saving weight",
        description: `Error: ${errorDetails?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWeightChange = () => {
    if (!currentWeight || !previousWeight) return null;
    const change = currentWeight - previousWeight;
    return change;
  };

  const getWeightChangeIcon = () => {
    const change = getWeightChange();
    if (!change) return null;

    if (change > 0) {
      return <TrendingUp className="h-3 w-3 text-red-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-3 w-3 text-green-500" />;
    }
    return null;
  };

  const getWeightChangeText = () => {
    const change = getWeightChange();
    if (!change) return '';

    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} kg`;
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="flex items-center gap-1 text-primary hover:text-accent transition-colors lowercase text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="update weight"
          >
            {currentWeight ? (
              <span className="flex items-center gap-1">
                <span
                  className="glitch-weight"
                  data-text={`${currentWeight}kg`}
                >
                  {currentWeight}kg
                </span>
                {getWeightChangeIcon()}
                {getWeightChangeText() && (
                  <span className="text-xs text-muted-foreground">
                    ({getWeightChangeText()})
                  </span>
                )}
              </span>
            ) : (
              <span>add weight</span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="lowercase">update weight</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="weight" className="text-right lowercase text-sm">
                weight (kg)
              </label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                max="500"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder={currentWeight?.toString() || "70.5"}
                className="col-span-3"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="lowercase"
            >
              cancel
            </Button>
            <Button
              onClick={handleAddWeight}
              disabled={isLoading || !newWeight.trim()}
              className="lowercase"
            >
              {isLoading ? 'saving...' : 'save weight'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
