import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getMember, clearMember } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import edawisLogo from '@/assets/edawis-logo.png';

interface ActiveQuestion {
  id: string;
  text: string;
  meeting_protocol: string;
  meeting_date: string;
  already_voted: boolean;
}

export default function VoterPage() {
  const navigate = useNavigate();
  const member = getMember();
  const { t } = useI18n();
  const [questions, setQuestions] = useState<ActiveQuestion[]>([]);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    if (!member) return;
    try {
      const { data: attendances } = await supabase
        .from('meeting_attendees')
        .select('meeting_id')
        .eq('member_id', member.id);

      if (!attendances?.length) { setQuestions([]); setLoading(false); return; }
      const meetingIds = attendances.map(a => a.meeting_id);

      const { data: votingQuestions } = await supabase
        .from('questions')
        .select('id, text, meeting_id, status')
        .eq('status', 'voting')
        .in('meeting_id', meetingIds);

      if (!votingQuestions?.length) { setQuestions([]); setLoading(false); return; }

      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, protocol_number, meeting_date')
        .in('id', meetingIds);

      const meetingMap = Object.fromEntries((meetings || []).map(m => [m.id, m]));

      const { data: myVotes } = await supabase
        .from('question_votes')
        .select('question_id')
        .eq('member_id', member.id)
        .in('question_id', votingQuestions.map(q => q.id));

      const votedSet = new Set((myVotes || []).map(v => v.question_id));

      setQuestions(votingQuestions.map(q => ({
        id: q.id,
        text: q.text,
        meeting_protocol: meetingMap[q.meeting_id]?.protocol_number || '',
        meeting_date: meetingMap[q.meeting_id]?.meeting_date || '',
        already_voted: votedSet.has(q.id),
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [member]);

  useEffect(() => {
    if (!member) { navigate('/'); return; }
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 4000);
    return () => clearInterval(interval);
  }, [member, navigate, fetchQuestions]);

  const castVote = async (questionId: string, voteType: 'for' | 'against' | 'abstain') => {
    if (!member) return;
    setVotingId(questionId);
    try {
      const { data, error } = await supabase.rpc('cast_vote', {
        p_question_id: questionId,
        p_member_id: member.id,
        p_vote_type: voteType,
      });
      if (error) throw error;
      if (data) { toast.success(t('vote_accepted')); fetchQuestions(); }
      else { toast.error(t('vote_not_possible')); }
    } catch (err: any) {
      toast.error(err.message || t('error'));
    } finally {
      setVotingId(null);
    }
  };

  const handleLogout = () => { clearMember(); navigate('/'); };

  if (!member) return null;

  const unanswered = questions.filter(q => !q.already_voted);
  const answered = questions.filter(q => q.already_voted);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={edawisLogo} alt="EDawis" className="w-8 h-8" />
          <div>
            <h1 className="font-semibold text-sm">EDawis</h1>
            <p className="text-xs text-muted-foreground">{member.name} (PIN: {member.pin})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="outline" size="sm" onClick={handleLogout}>{t('logout')}</Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
        ) : unanswered.length === 0 && answered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-muted-foreground">{t('no_active_votes')}</p>
            </CardContent>
          </Card>
        ) : unanswered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium">{t('all_voted')}</p>
            </CardContent>
          </Card>
        ) : (
          unanswered.map((q) => (
            <Card key={q.id} className="animate-fade-in-up">
              <CardHeader className="pb-2">
                <div className="text-xs text-muted-foreground mb-1">
                  {t('meeting_label')} №{q.meeting_protocol} • {q.meeting_date}
                </div>
                <CardTitle className="text-base leading-relaxed">{q.text}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => castVote(q.id, 'for')} disabled={votingId === q.id}>
                    {t('vote_for')}
                  </Button>
                  <Button variant="destructive" onClick={() => castVote(q.id, 'against')} disabled={votingId === q.id}>
                    {t('vote_against')}
                  </Button>
                  <Button variant="secondary" onClick={() => castVote(q.id, 'abstain')} disabled={votingId === q.id}>
                    {t('vote_abstain')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {answered.length > 0 && (
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-2">⚠️ {t('already_voted')}:</p>
            {answered.map(q => (
              <Card key={q.id} className="mb-2 opacity-60">
                <CardContent className="py-3">
                  <p className="text-sm">{q.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('voted_check')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
