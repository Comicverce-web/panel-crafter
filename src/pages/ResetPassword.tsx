import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeRecoverySession = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const hasRecoveryHash = hashParams.get('type') === 'recovery';
        const checks = hasRecoveryHash ? 8 : 1;

        for (let attempt = 0; attempt < checks; attempt++) {
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            if (isMounted) {
              setIsValidSession(true);
            }
            return;
          }

          if (attempt < checks - 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 250));
          }
        }

        if (isMounted) {
          toast.error('Invalid or expired reset link.');
          navigate('/auth', { replace: true });
        }
      } catch (error: any) {
        if (isMounted) {
          toast.error(error?.message || 'Invalid or expired reset link.');
          navigate('/auth', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    void initializeRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut({ scope: 'local' });
      toast.success('Password updated! Please sign in again.');
      navigate('/auth', { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Unable to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>
      <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur border-border">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-10 h-10 text-primary" />
            <h1 className="font-comic text-3xl text-gradient-primary">ComicForge</h1>
          </div>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-muted/50" required minLength={6} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 bg-muted/50" required minLength={6} />
            </div>
            <Button type="submit" variant="comic" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

