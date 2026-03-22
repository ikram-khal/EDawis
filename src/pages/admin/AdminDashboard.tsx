import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';

export default function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState({ members: 0, meetings: 0, activeVotes: 0 });

  useEffect(() => {
    async function load() {
      const [{ count: mc }, { count: mtc }, { count: vc }] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('meetings').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'voting'),
      ]);
      setStats({ members: mc || 0, meetings: mtc || 0, activeVotes: vc || 0 });
    }
    load();
  }, []);

  const cards = [
    { label: t('members'), value: stats.members, icon: '👥' },
    { label: t('meetings'), value: stats.meetings, icon: '📋' },
    { label: t('active_votes'), value: stats.activeVotes, icon: '🗳️' },
  ];

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-xl font-bold mb-6">{t('control_panel')}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <span className="text-2xl">{c.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
