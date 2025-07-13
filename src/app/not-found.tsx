// src/app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 md:p-8 selection:bg-primary selection:text-primary-foreground">
      <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
      <h1 className="text-4xl font-bold text-primary mb-3 lowercase">404 - page not found</h1>
      <p className="text-xl text-muted-foreground mb-8 lowercase">
        oops! the page you are looking for does not exist or could not be found.
      </p>
      <Button asChild size="lg">
        <Link href="/">go back home</Link>
      </Button>
    </div>
  );
}
