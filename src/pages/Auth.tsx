import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, Mail, Lock, Sparkles, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type AuthView = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

  const clearStaleAuthCache = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const authKey = `sb-${projectId}-auth-token`;

    try {
      localStorage.removeItem(authKey);
    } catch {
      // Ignore storage cleanup failures
    }
  };

  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
    new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error('Request timeout. Retrying...'));
      }, timeoutMs);

      promise
        .then((value) => {
          window.clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          window.clearTimeout(timeoutId);
          reject(error);
        });
    });

  const isNetworkIssue = (error: unknown) => {
    if (error instanceof TypeError) return true;
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    return message.includes('load failed') || message.includes('fetch') || message.includes('network') || message.includes('timeout');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const maxAttempts = 2;
      let signInData: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({ email: email.trim(), password }),
            8000
          );

          if (error) throw error;
          signInData = data;
          break;
        } catch (attemptError) {
          const shouldRetry = attempt < maxAttempts && isNetworkIssue(attemptError);
          if (!shouldRetry) throw attemptError;

          clearStaleAuthCache();
          await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        }
      }

      if (!signInData?.user) {
        throw new Error('Unable to sign in right now. Please try again.');
      }

      toast.success('Welcome back!');
      navigate('/', { replace: true });

      void (async () => {
        const { data: roleData } = await supabase.rpc('has_role', {
          _user_id: signInData.user.id,
          _role: 'admin',
        });

        if (roleData) {
          navigate('/dev-dashboard', { replace: true });
        }
      })();
    } catch (error: any) {
      toast.error(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      toast.success('Account created! You can now sign in.');
      setView('login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent! Check your email.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTitle = () => {
    switch (view) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot-password': return 'Reset Password';
    }
  };

  const renderDescription = () => {
    switch (view) {
      case 'login': return 'Sign in to continue creating amazing comics';
      case 'signup': return 'Start your comic creation journey';
      case 'forgot-password': return 'Enter your email and we\'ll send you a reset link';
    }
  };

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
          <CardTitle className="text-2xl">{renderTitle()}</CardTitle>
          <CardDescription>{renderDescription()}</CardDescription>
        </CardHeader>

        <CardContent>
          {view === 'forgot-password' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted/50"
                  required
                />
              </div>
              <Button type="submit" variant="comic" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
              </Button>
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto"
                onClick={() => setView('login')}
              >
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-muted/50"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-muted/50"
                    required
                    minLength={6}
                  />
                </div>

                {view === 'login' && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setView('forgot-password')}
                  >
                    Forgot password?
                  </button>
                )}

                <Button type="submit" variant="comic" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {view === 'login' ? 'Signing in...' : 'Creating account...'}</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> {view === 'login' ? 'Sign In' : 'Create Account'}</>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                >
                  {view === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
