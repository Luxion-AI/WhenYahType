import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getGuestUsername, setGuestUsername } from '../../lib/storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  username: string;
  displayName: string;
  loading: boolean;
  isGuest: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, username: string) => Promise<{ error?: string }>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsernameState] = useState<string>(getGuestUsername());
  const [displayName, setDisplayName] = useState<string>('Guest Player');
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(true);

  // Sync profile details from Supabase
  const loadProfile = async (uid: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', uid)
        .single();

      if (!error && data) {
        setUsernameState(data.username);
        setDisplayName(data.display_name || data.username);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setIsGuest(currentSession.user.is_anonymous || false);
        loadProfile(currentSession.user.id);
      } else {
        setIsGuest(true);
      }
      setLoading(false);
    });

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setIsGuest(newSession.user.is_anonymous || false);
        loadProfile(newSession.user.id);
      } else {
        setIsGuest(true);
        setUsernameState(getGuestUsername());
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (!supabase) return { error: 'Database backend not connected' };
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error: error?.message };
  };

  const signUp = async (email: string, pass: string, desiredUsername: string) => {
    if (!supabase) return { error: 'Database backend not connected' };
    const cleanUsername = desiredUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (cleanUsername.length < 3 || cleanUsername.length > 25) {
      return { error: 'Username must be 3-25 alphanumeric characters, hyphens or underscores' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          username: cleanUsername,
          display_name: desiredUsername.trim(),
        },
      },
    });

    return { error: error?.message };
  };

  const signInAsGuest = async () => {
    if (!supabase) {
      // Local fallback
      setIsGuest(true);
      return;
    }

    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn('Anonymous auth disabled in Supabase, using local guest mode:', error.message);
        setIsGuest(true);
      }
    } catch {
      setIsGuest(true);
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsGuest(true);
    const guest = getGuestUsername();
    setUsernameState(guest);
    setDisplayName('Guest Player');
  };

  const updateUsername = async (newUsername: string) => {
    const clean = newUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean.length < 3 || clean.length > 25) {
      return { error: 'Username must be 3-25 characters long (letters, numbers, _, -)' };
    }

    if (!user || isGuest || !supabase) {
      setGuestUsername(clean);
      setUsernameState(clean);
      setDisplayName(clean);
      return {};
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: clean, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      return { error: error.message.includes('unique') ? 'This username is already taken' : error.message };
    }

    setUsernameState(clean);
    return {};
  };

  const deleteAccount = async () => {
    if (!user || !supabase) return { error: 'Not authenticated' };
    try {
      // Cascade delete user runs and profile
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
      return {};
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed';
      return { error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        username,
        displayName,
        loading,
        isGuest,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        updateUsername,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
