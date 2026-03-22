import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId, setMember, setAdmin } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import edawisLogo from '@/assets/edawis-logo.png';

export default function LoginPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<'voter' | 'admin'>('voter');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.rpc('admin_exists').then(({ data }) => {
      setAdminExists(!!data);
    });
  }, []);

  // Reset fields when switching modes
  useEffect(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setPin('');
  }, [mode]);

  const handleVoterLogin = async () => {
    if (!pin.trim()) return;
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('pin', pin.trim())
        .maybeSingle();

      if (error) throw error;
      if (!member) { toast.error(t('pin_not_found')); return; }
      if (member.session_id && member.session_id !== sessionId) {
        toast.error(t('pin_bound_other'));
        return;
      }
      if (!member.session_id) {
        await supabase.from('members').update({ session_id: sessionId }).eq('id', member.id);
      }
      setMember({ id: member.id, name: member.name, pin: member.pin });
      toast.success(`${t('welcome')}, ${member.name}!`);
      navigate('/vote');
    } catch (err: any) {
      toast.error(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_login', {
        p_username: username.trim(),
        p_password: password,
      });
      if (error) throw error;
      if (data) {
        setAdmin(true, username.trim());
        toast.success(t('admin_panel'));
        navigate('/admin');
      } else {
        toast.error(t('wrong_password'));
      }
    } catch (err: any) {
      toast.error(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async () => {
    if (!username.trim() || !password || !confirmPassword) return;
    if (password.length < 6) {
      toast.error(t('password_too_short'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('passwords_mismatch'));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_register', {
        p_username: username.trim(),
        p_password: password,
      });
      if (error) throw error;
      if (data) {
        setAdminExists(true);
        toast.success(t('account_created'));
        // Clear registration fields, switch to login
        setUsername('');
        setPassword('');
        setConfirmPassword('');
      } else {
        toast.error(t('admin_exists'));
      }
    } catch (err: any) {
      toast.error(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  // --- Admin login form (reusable) ---
  const AdminLoginForm = (
    <div className="space-y-4">
      <Input
        placeholder={t('username')}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        type="password"
        placeholder={t('password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
      />
      <Button className="w-full" onClick={handleAdminLogin} disabled={loading}>
        {loading ? t('checking') : t('login')}
      </Button>
    </div>
  );

  // --- Admin registration form (reusable) ---
  const AdminRegisterForm = (
    <div className="space-y-4">
      <Input
        placeholder={t('username')}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        type="password"
        placeholder={t('password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        type="password"
        placeholder={t('confirm_password')}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdminRegister()}
      />
      <p className="text-xs text-muted-foreground">{t('password_min_length')}</p>
      <Button className="w-full" onClick={handleAdminRegister} disabled={loading}>
        {loading ? t('checking') : t('register')}
      </Button>
    </div>
  );

  // --- Render admin section ---
  const renderAdminSection = () => {
    // Still loading admin status
    if (adminExists === null) {
      return <p className="text-center text-muted-foreground">{t('loading')}</p>;
    }

    // Admin already exists — only login
    if (adminExists) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('admin_login')}</CardTitle>
          </CardHeader>
          <CardContent>{AdminLoginForm}</CardContent>
        </Card>
      );
    }

    // No admin yet — show both tabs: Login & Register
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">{t('login')}</TabsTrigger>
              <TabsTrigger value="register">{t('register')}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">{AdminLoginForm}</TabsContent>
            <TabsContent value="register">{AdminRegisterForm}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <img src={edawisLogo} alt="EDawis" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tight">EDawis</h1>
          <p className="text-muted-foreground mt-1">{t('app_subtitle')}</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'voter' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('voter')}
          >
            {t('voter')}
          </Button>
          <Button
            variant={mode === 'admin' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('admin')}
          >
            {t('admin')}
          </Button>
        </div>

        {mode === 'voter' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('enter_pin')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder={t('enter_pin')}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVoterLogin()}
                  maxLength={10}
                  className="text-center text-lg tracking-widest"
                />
                <Button className="w-full" onClick={handleVoterLogin} disabled={loading}>
                  {loading ? t('checking') : t('login')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          renderAdminSection()
        )}
      </div>
    </div>
  );
}
