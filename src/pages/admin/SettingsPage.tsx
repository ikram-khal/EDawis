import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getAdminUsername } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error(t('passwords_mismatch'));
      return;
    }
    setLoading(true);
    try {
      const username = getAdminUsername();
      const { data, error } = await supabase.rpc('admin_change_password', {
        p_username: username,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });
      if (error) throw error;
      if (data) {
        toast.success(t('password_changed'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(t('wrong_password'));
      }
    } catch (err: any) {
      toast.error(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up max-w-lg">
      <h2 className="text-xl font-bold mb-6">{t('settings')}</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('change_password')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder={t('current_password')}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder={t('new_password')}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder={t('confirm_password')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
          />
          <Button onClick={handleChangePassword} disabled={loading}>
            {t('change_password')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
