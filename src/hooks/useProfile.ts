import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_plan: string;
  credits_remaining: number;
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet (for existing users before trigger)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          })
          .select()
          .single();
        if (!insertError && newProfile) {
          setProfile(newProfile as unknown as Profile);
        }
      } else if (data) {
        setProfile(data as unknown as Profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const memoizedProfile = useMemo(() => profile, [profile]);

  return { profile: memoizedProfile, isLoading, refetch: fetchProfile };
}
