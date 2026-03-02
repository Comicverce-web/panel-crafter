import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Key, Users, DollarSign, Shield, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface ApiKeyEntry {
  id: string;
  key_name: string;
  provider: string;
  api_key_encrypted: string;
  is_active: boolean;
  created_at: string;
}

interface PromotionRequest {
  id: string;
  user_id: string;
  project_id: string;
  subscription_plan: string;
  status: string;
  created_at: string;
  reviewed: boolean;
  user_email?: string;
  project_title?: string;
}

// Auto-detect AI provider from key prefix
function detectProvider(key: string): string {
  if (key.startsWith('sk-') && key.length > 40) return 'openai';
  if (key.startsWith('AIza')) return 'google';
  if (key.startsWith('ant-')) return 'anthropic';
  if (key.startsWith('r8_')) return 'replicate';
  if (key.startsWith('hf_')) return 'huggingface';
  if (key.startsWith('sk-or-')) return 'openrouter';
  return 'unknown';
}

export default function DevDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [newKeyInputs, setNewKeyInputs] = useState<string[]>(['']);

  // Promotion requests
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    freePlan: 0,
    proPlan: 0,
    premiumPlan: 0,
    customPlan: 0,
  });

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);

      // Check admin role via database function
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin',
      });

      if (error || !data) {
        toast.error('Access denied: Admin privileges required');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  // Load dashboard data
  useEffect(() => {
    if (!isAdmin) return;
    loadApiKeys();
    loadStats();
    loadPromotionRequests();
  }, [isAdmin]);

  const loadApiKeys = async () => {
    const { data } = await supabase.from('ai_api_keys').select('*').order('created_at', { ascending: false });
    if (data) setApiKeys(data as unknown as ApiKeyEntry[]);
  };

  const loadStats = async () => {
    const { data: profiles } = await supabase.from('profiles').select('subscription_plan');
    if (profiles) {
      setStats({
        totalUsers: profiles.length,
        freePlan: profiles.filter(p => p.subscription_plan === 'free').length,
        proPlan: profiles.filter(p => p.subscription_plan === 'pro').length,
        premiumPlan: profiles.filter(p => p.subscription_plan === 'premium').length,
        customPlan: profiles.filter(p => p.subscription_plan === 'custom').length,
      });
    }
  };

  const loadPromotionRequests = async () => {
    const { data } = await supabase
      .from('promotion_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      // Enrich with user emails and project titles
      const enriched = await Promise.all(
        (data as unknown as PromotionRequest[]).map(async (req) => {
          const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', req.user_id).single();
          const { data: project } = await supabase.from('projects').select('title').eq('id', req.project_id).single();
          return {
            ...req,
            user_email: profile?.display_name || 'Unknown',
            project_title: project?.title || 'Unknown',
          };
        })
      );
      setPromotionRequests(enriched);
    }
  };

  // API Key management
  const addKeyInput = () => setNewKeyInputs(prev => [...prev, '']);
  const removeKeyInput = (idx: number) => setNewKeyInputs(prev => prev.filter((_, i) => i !== idx));
  const updateKeyInput = (idx: number, val: string) => {
    setNewKeyInputs(prev => prev.map((v, i) => i === idx ? val : v));
  };

  const submitApiKeys = async () => {
    const validKeys = newKeyInputs.filter(k => k.trim().length > 10);
    if (validKeys.length === 0) {
      toast.error('Enter at least one valid API key');
      return;
    }

    for (const key of validKeys) {
      const provider = detectProvider(key);
      const { error } = await supabase.from('ai_api_keys').insert({
        key_name: `${provider}-${Date.now()}`,
        provider,
        api_key_encrypted: key,
        is_active: true,
      });
      if (error) {
        toast.error(`Failed to add key: ${error.message}`);
        return;
      }
    }

    toast.success(`${validKeys.length} API key(s) integrated successfully!`);
    setNewKeyInputs(['']);
    loadApiKeys();
  };

  const deleteApiKey = async (id: string) => {
    await supabase.from('ai_api_keys').delete().eq('id', id);
    loadApiKeys();
    toast.success('API key removed');
  };

  const toggleReviewed = async (id: string, reviewed: boolean) => {
    await supabase.from('promotion_requests').update({ reviewed }).eq('id', id);
    loadPromotionRequests();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-comic text-2xl text-gradient-primary">Developer Dashboard</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-card/80">
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{stats.freePlan}</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{stats.proPlan}</p>
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{stats.premiumPlan}</p>
              <p className="text-xs text-muted-foreground">Premium Plan</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{stats.customPlan}</p>
              <p className="text-xs text-muted-foreground">Custom Plan</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="promotions" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="promotions">Promotion Requests</TabsTrigger>
            <TabsTrigger value="api-keys">AI API Keys</TabsTrigger>
          </TabsList>

          {/* Promotion Requests Tab */}
          <TabsContent value="promotions">
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="font-comic text-xl">Promotion Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {promotionRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No promotion requests yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Reviewed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotionRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.user_email}</TableCell>
                          <TableCell>{req.project_title}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{req.subscription_plan}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={req.reviewed}
                              onCheckedChange={(v) => toggleReviewed(req.id, !!v)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="font-comic text-xl flex items-center gap-2">
                  <Key className="w-5 h-5" /> AI API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing keys */}
                {apiKeys.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Key Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell>
                            <Badge variant="outline">{key.provider}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{key.key_name}</TableCell>
                          <TableCell>
                            <Badge variant={key.is_active ? 'default' : 'secondary'}>
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(key.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => deleteApiKey(key.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Add new keys */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Add API Keys</h4>
                  {newKeyInputs.map((val, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Paste API key here (auto-detects provider)"
                        value={val}
                        onChange={(e) => updateKeyInput(idx, e.target.value)}
                        className="font-mono text-sm bg-muted/50"
                      />
                      {newKeyInputs.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeKeyInput(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addKeyInput} className="gap-1">
                      <Plus className="w-3 h-3" /> Add More
                    </Button>
                    <Button variant="comic" size="sm" onClick={submitApiKeys}>
                      Enter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
