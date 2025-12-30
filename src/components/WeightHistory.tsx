"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { WeightEntry } from '@/types';
import { Scale, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function WeightHistory() {
  const { user } = useAuth();
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWeightHistory();
    }
  }, [user]);

  const fetchWeightHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const weightsCol = collection(db, 'weights');
      const q = query(
        weightsCol,
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const weightSnapshot = await getDocs(q);
      const weights = weightSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate().toISOString(),
      })) as WeightEntry[];

      setWeightHistory(weights);
    } catch (error) {
      console.error('Error fetching weight history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeightChange = (current: WeightEntry, previous?: WeightEntry) => {
    if (!previous) return null;
    return current.weight - previous.weight;
  };

  const getWeightChangeIcon = (change: number | null) => {
    if (!change) return null;

    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getWeightChangeText = (change: number | null) => {
    if (!change) return '';

    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} kg`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Scale className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground lowercase">loading weight history...</p>
      </div>
    );
  }

  if (weightHistory.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary lowercase">
            <Scale className="h-5 w-5" />
            weight history
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Scale className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground lowercase">no weight entries yet.</p>
            <p className="text-sm text-muted-foreground lowercase mt-2">
              click on your weight in the header to add your first entry.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary lowercase">
          <Scale className="h-5 w-5" />
          weight history
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weightHistory.map((entry, index) => {
            const previousEntry = weightHistory[index + 1];
            const change = getWeightChange(entry, previousEntry);

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground lowercase">
                      {format(parseISO(entry.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {entry.weight} kg
                  </Badge>
                </div>

                {change !== null && (
                  <div className="flex items-center gap-1">
                    {getWeightChangeIcon(change)}
                    <span className={`text-sm font-medium ${
                      change > 0 ? 'text-red-500' :
                      change < 0 ? 'text-green-500' : 'text-muted-foreground'
                    }`}>
                      {getWeightChangeText(change)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground lowercase">total entries:</span>
            <Badge variant="outline">{weightHistory.length}</Badge>
          </div>
          {weightHistory.length > 1 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground lowercase">total change:</span>
              <div className="flex items-center gap-1">
                {getWeightChangeIcon(weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight)}
                <span className={`font-medium ${
                  (weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight) > 0 ? 'text-red-500' :
                  (weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight) < 0 ? 'text-green-500' : 'text-muted-foreground'
                }`}>
                  {getWeightChangeText(weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
