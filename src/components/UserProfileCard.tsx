import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Settings, LogOut, User, ChevronUp, Zap, Crown } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface UserProfileCardProps {
  profile: Profile | null;
  email: string | null;
  isLoading?: boolean;
  isCollapsed?: boolean;
}

const planIcons: Record<string, typeof Crown> = {
  free: Zap,
  pro: Crown,
  premium: Crown,
  custom: Settings,
};

const planLabels: Record<string, string> = {
  free: 'Free Plan',
  pro: 'Pro Plan',
  premium: 'Premium Plan',
  custom: 'Custom Plan',
};

export const UserProfileCard = memo(function UserProfileCard({
  profile,
  email,
  isLoading,
  isCollapsed,
}: UserProfileCardProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!profile && !isLoading) {
    return (
      <Button
        onClick={() => navigate('/auth')}
        className="w-full h-10 rounded-[10px] bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white font-medium"
      >
        Sign in
      </Button>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 p-3">
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-muted rounded animate-pulse w-24" />
          <div className="h-3 bg-muted rounded animate-pulse w-32" />
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || email?.split('@')[0] || 'User';
  const plan = profile?.subscription_plan || 'free';
  const PlanIcon = planIcons[plan] || Zap;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Collapsed mobile view
  if (isCollapsed) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="fixed bottom-4 left-4 z-[1000] w-12 h-12 rounded-full shadow-lg border border-border bg-card hover:bg-muted transition-colors">
            <Avatar className="w-12 h-12">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} loading="lazy" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-[220px] bg-[hsl(222,47%,11%)] border-[hsl(215,28%,17%)] rounded-[10px]">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-[hsl(218,11%,65%)] truncate">{email}</p>
          </div>
          <DropdownMenuSeparator className="bg-[hsl(215,28%,17%)]" />
          <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white focus:bg-[hsl(215,28%,17%)] gap-2 cursor-pointer">
            <User className="w-4 h-4" /> View Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white focus:bg-[hsl(215,28%,17%)] gap-2 cursor-pointer" onClick={() => navigate('/account/settings')}>
            <CreditCard className="w-4 h-4" /> Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[hsl(215,28%,17%)]" />
          <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-[hsl(215,28%,17%)] gap-2 cursor-pointer" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="p-3 border-t border-sidebar-border">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-2.5 p-3 rounded-xl transition-colors cursor-pointer",
              "bg-[hsl(222,47%,11%)] border border-[hsl(215,28%,17%)]",
              "hover:bg-[hsl(215,28%,17%)]",
              "shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            )}
          >
            <Avatar className="w-10 h-10 shrink-0">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} loading="lazy" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-[hsl(218,11%,65%)] truncate">{email}</p>
            </div>
            <ChevronUp className="w-4 h-4 text-[hsl(218,11%,65%)] shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-[220px] bg-[hsl(222,47%,11%)] border-[hsl(215,28%,17%)] rounded-[10px]">
          <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white focus:bg-[hsl(215,28%,17%)] gap-2 cursor-pointer">
            <User className="w-4 h-4" /> View Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white focus:bg-[hsl(215,28%,17%)] gap-2 cursor-pointer" onClick={() => navigate('/account/settings')}>
            <CreditCard className="w-4 h-4" /> Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[hsl(215,28%,17%)]" />
          <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-[hsl(215,28%,17%)] gap-2 cursor-pointer" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Subscription & Credits info */}
      <div className="mt-2 space-y-1 px-1">
        <div className="flex items-center gap-2 text-xs text-[hsl(218,11%,65%)]">
          <PlanIcon className="w-3.5 h-3.5 text-primary" />
          <span>{planLabels[plan] || 'Free Plan'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[hsl(218,11%,65%)]">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{profile?.credits_remaining ?? 0} credits left</span>
        </div>
        <button
          onClick={() => navigate('/account/settings')}
          className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer mt-1"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Manage Account</span>
        </button>
      </div>
    </div>
  );
});
