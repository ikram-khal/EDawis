import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

interface Meeting {
  id: string; protocol_number: string; meeting_date: string;
  question_count: number; closed_count: number;
}

export default function MeetingsPage() {
  const { t } = useI18n();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [date, setDate] = useState('');
  const [protocol, setProtocol] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    const { data: meetingsData } = await supabase.from('meetings').select('*').order('created_at', { ascending: false });
    if (!meetingsData) { setLoading(false); return; }
    const { data: questions } = await supabase.from('questions').select('meeting_id, status');
    const qMap: Record<string, { total: number; closed: number }> = {};
    (questions || []).forEach(q => {
      if (!qMap[q.meeting_id]) qMap[q.meeting_id] = { total: 0, closed: 0 };
      qMap[q.meeting_id].total++;
      if (q.status === 'closed') qMap[q.meeting_id].closed++;
    });
    setMeetings(meetingsData.map(m => ({
      ...m, question_count: qMap[m.id]?.total || 0, closed_count: qMap[m.id]?.closed || 0,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createMeeting = async () => {
    if (!date.trim() || !protocol.trim()) return;
    const { error } = await supabase.from('meetings').insert({ meeting_date: date.trim(), protocol_number: protocol.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success(t('meeting_created'));
    setDate(''); setProtocol('');
    load();
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm(t('delete_meeting_confirm'))) return;
    await supabase.from('meetings').delete().eq('id', id);
    toast.success(t('deleted'));
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-xl font-bold">{t('meetings')}</h2>
      <Card>
        <CardHeader><CardTitle className="text-base">{t('new_meeting')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder={t('date_placeholder')} value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
            <Input placeholder={`${t('protocol_number')} №`} value={protocol} onChange={e => setProtocol(e.target.value)} className="w-32" />
            <Button onClick={createMeeting}>{t('create')}</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
      ) : meetings.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{t('no_meetings')}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {meetings.map(m => (
            <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/admin/meetings/${m.id}`)}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{t('meeting_label')} №{m.protocol_number}</div>
                  <div className="text-sm text-muted-foreground">{m.meeting_date} • {m.question_count} {t('question_label')} ({m.closed_count} {t('closed_label')})</div>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteMeeting(m.id); }} className="text-destructive">🗑️</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
