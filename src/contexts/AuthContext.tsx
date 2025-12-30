"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate consistent email for each username
const getUserEmail = (username: string): string => {
  return `${username.toLowerCase()}@treine.app`;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);

      // Determine username based on user's display name
      if (user?.displayName) {
        setUsername(user.displayName);
      } else {
        setUsername(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (enteredUsername: string, enteredPassword: string) => {
    if (!enteredUsername.trim() || !enteredPassword.trim()) {
      throw new Error('Username and password are required');
    }

    try {
      const email = getUserEmail(enteredUsername.trim());
      await signInWithEmailAndPassword(auth, email, enteredPassword);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('Account not found. Please create an account first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else {
        throw new Error('Login failed: ' + error.message);
      }
    }
  };

  const register = async (enteredUsername: string, password: string) => {
    if (!enteredUsername.trim() || !password.trim()) {
      throw new Error('Username and password are required');
    }

    // Basic username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(enteredUsername.trim())) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    try {
      const email = getUserEmail(enteredUsername.trim());
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update the user's display name to match the username
      await updateProfile(userCredential.user, {
        displayName: enteredUsername.trim()
      });

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Username already taken. Please choose another one.');
      } else {
        throw new Error('Registration failed: ' + error.message);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, username, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
