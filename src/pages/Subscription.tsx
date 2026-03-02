import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Check, Crown, Sparkles, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Placeholder Stripe price IDs - update after creating products in Stripe dashboard
const PRICE_IDS = {
  pro_monthly: 'price_pro_monthly_placeholder',
  pro_yearly: 'price_pro_yearly_placeholder',
  premium_monthly: 'price_premium_monthly_placeholder',
  premium_yearly: 'price_premium_yearly_placeholder',
  custom_monthly: 'price_custom_monthly_placeholder',
};

interface PlanFeature {
  text: string;
  included: boolean;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Zap,
    description: 'Get started with basic comic creation',
    credits: 5,
    features: [
      { text: '5 daily credits', included: true },
      { text: '1 free manga per 5 generations', included: true },
      { text: 'Basic panel generation', included: true },
      { text: 'Detailed panels', included: false },
      { text: 'No watermarks', included: false },
      { text: 'Competition access', included: false },
    ] as PlanFeature[],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 3,
    yearlyPrice: 30,
    icon: Sparkles,
    description: 'For serious comic creators',
    credits: 20,
    popular: true,
    features: [
      { text: '20 daily credits', included: true },
      { text: '1 free manga per 5 generations', included: true },
      { text: 'Precise/detailed panels', included: true },
      { text: 'Monthly competition access', included: true },
      { text: 'No watermarks', included: false },
      { text: 'Social media promotion', included: false },
    ] as PlanFeature[],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 8,
    yearlyPrice: 80,
    icon: Crown,
    description: 'Full creative control & promotion',
    credits: 40,
    features: [
      { text: '40 daily credits', included: true },
      { text: '2 free mangas per 5 generations', included: true },
      { text: 'Choice of AI models', included: true },
      { text: 'NO watermarks', included: true },
      { text: 'ALL competitions', included: true },
      { text: 'Social media promotion', included: true },
    ] as PlanFeature[],
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('free');

  // Custom plan state
  const [customCredits, setCustomCredits] = useState(5);
  const [addAudioPromo, setAddAudioPromo] = useState(false);
  const [addVideoPromo, setAddVideoPromo] = useState(false);
  const [addAudiobook, setAddAudiobook] = useState(false);
  const [customBilling, setCustomBilling] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');

  // Calculate custom plan pricing
  const customPricing = useMemo(() => {
    let base = 3; // Starting at $3/month
    // Credits scaling: 5 to 10 costs +$2
    if (customCredits > 5) {
      base += 2; // 5->10 costs $2
    }
    // 10-50: each increment of 10 costs $1
    if (customCredits > 10) {
      const increments = Math.min(Math.floor((customCredits - 10) / 10), 4);
      base += increments * 1;
    }
    // 50+: each increment of 10 costs $2
    if (customCredits > 50) {
      const increments = Math.floor((customCredits - 50) / 10);
      base += increments * 2;
    }
    // Add-ons
    if (addAudioPromo) base += 3;
    if (addVideoPromo) base += 5;
    if (addAudiobook) base += 5;

    const monthly = base;
    const yearly = base * 10; // ~17% discount
    const lifetime = monthly * 60 - 5;

    return { monthly, yearly, lifetime };
  }, [customCredits, addAudioPromo, addVideoPromo, addAudiobook]);

  // Custom bonus generation
  const customBonus = useMemo(() => {
    if (customCredits < 30) return '1 bonus generation per 5 successful';
    if (customCredits < 40) return '1 bonus generation per 5 successful';
    if (customCredits < 60) return '2 bonus generations per 5 successful';
    return '1/3rd of previous month\'s successful generations';
  }, [customCredits]);

  // Check subscription on load
  useEffect(() => {
    const checkSub = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        if (!error && data?.subscribed && data?.product_id) {
          // Map product_id to plan name (would be dynamic in production)
          setCurrentPlan(data.product_id);
        }
      } catch {
        // Ignore - defaults to free
      }
    };
    checkSub();
  }, []);

  const handleSubscribe = async (planId: string, priceId: string) => {
    setIsLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open subscription management');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="font-comic text-3xl text-gradient-primary">ComicForge Plans</h1>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={cn("text-sm font-medium", !isYearly ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={cn("text-sm font-medium", isYearly ? "text-foreground" : "text-muted-foreground")}>
            Yearly <Badge variant="secondary" className="ml-1 text-xs">Save ~17%</Badge>
          </span>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col bg-card/80 backdrop-blur border-border transition-all hover:border-primary/50",
                plan.popular && "border-primary shadow-glow-primary"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <plan.icon className="w-10 h-10 mx-auto text-primary mb-2" />
                <CardTitle className="font-comic text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-4xl font-bold text-foreground">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    /{isYearly ? 'year' : 'month'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className={cn("w-4 h-4 shrink-0", feature.included ? "text-success" : "text-muted-foreground/30")} />
                      <span className={cn(!feature.included && "text-muted-foreground/50 line-through")}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.id === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant="comic"
                    className="w-full"
                    disabled={isLoading !== null}
                    onClick={() => {
                      const priceId = plan.id === 'pro'
                        ? (isYearly ? PRICE_IDS.pro_yearly : PRICE_IDS.pro_monthly)
                        : (isYearly ? PRICE_IDS.premium_yearly : PRICE_IDS.premium_monthly);
                      handleSubscribe(plan.id, priceId);
                    }}
                  >
                    {isLoading === plan.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <>Subscribe to {plan.name}</>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Custom Plan */}
        <Card className="bg-card/80 backdrop-blur border-border">
          <CardHeader className="text-center">
            <Badge variant="secondary" className="w-fit mx-auto mb-2">Power Users</Badge>
            <CardTitle className="font-comic text-3xl text-gradient-accent">Custom Plan</CardTitle>
            <CardDescription>Scale your resources exactly how you need them</CardDescription>
          </CardHeader>
          <CardContent className="max-w-2xl mx-auto space-y-8">
            {/* Credit Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Daily Credits</label>
                <span className="font-comic text-xl text-primary">{customCredits}</span>
              </div>
              <Slider
                value={[customCredits]}
                onValueChange={([v]) => setCustomCredits(v)}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Bonus info */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Bonus: </strong>{customBonus}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                ⚠️ Custom plans are locked to the current app version. Upgrading costs min $2/version.
              </p>
            </div>

            {/* Promotional Add-ons */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Promotional Add-ons</h4>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                <Checkbox checked={addAudioPromo} onCheckedChange={(v) => setAddAudioPromo(!!v)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Basic Audio Promo (IG Story/YouTube)</p>
                  <p className="text-xs text-muted-foreground">+$3/month</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                <Checkbox checked={addVideoPromo} onCheckedChange={(v) => setAddVideoPromo(!!v)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Video Trailer Promo (IG/YouTube Video)</p>
                  <p className="text-xs text-muted-foreground">+$5/month ($3 base + $2 upgrade)</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                <Checkbox checked={addAudiobook} onCheckedChange={(v) => setAddAudiobook(!!v)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Audiobook Manga Explanation</p>
                  <p className="text-xs text-muted-foreground">+$5/month</p>
                </div>
              </label>
            </div>

            {/* Billing toggle for custom */}
            <div className="flex gap-2 flex-wrap">
              {(['monthly', 'yearly', 'lifetime'] as const).map((b) => (
                <Button
                  key={b}
                  variant={customBilling === b ? 'comic' : 'outline'}
                  size="sm"
                  onClick={() => setCustomBilling(b)}
                >
                  {b === 'monthly' ? 'Monthly' : b === 'yearly' ? 'Yearly' : 'Lifetime'}
                </Button>
              ))}
            </div>

            {/* Price display */}
            <div className="text-center py-4">
              <span className="text-5xl font-bold text-foreground">
                ${customBilling === 'monthly' ? customPricing.monthly : customBilling === 'yearly' ? customPricing.yearly : customPricing.lifetime}
              </span>
              <span className="text-muted-foreground text-sm ml-1">
                {customBilling === 'lifetime' ? ' one-time' : `/${customBilling === 'monthly' ? 'mo' : 'yr'}`}
              </span>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              variant="comic"
              size="xl"
              disabled={isLoading !== null}
              onClick={() => handleSubscribe('custom', PRICE_IDS.custom_monthly)}
            >
              {isLoading === 'custom' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <>Subscribe to Custom Plan</>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Manage subscription */}
        <div className="text-center mt-8">
          <Button variant="link" onClick={handleManageSubscription} disabled={isLoading === 'manage'}>
            {isLoading === 'manage' ? 'Opening...' : 'Manage Existing Subscription'}
          </Button>
        </div>
      </div>
    </div>
  );
}
