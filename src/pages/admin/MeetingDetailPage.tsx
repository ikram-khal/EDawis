import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { VoteBar } from '@/components/VoteBar';
import { generateReport } from '@/lib/docx-report';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

interface Member { id: string; name: string; pin: string; }
interface Question {
  id: string; text: string; status: string;
  votes_for: number; votes_against: number; votes_abstain: number;
  voted_count: number;
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const [meeting, setMeeting] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendeeIds, setAttendeeIds] = useState<Set<string>>(new Set());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [attendeePage, setAttendeePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const PER_PAGE = 8;

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: mtg }, { data: allMembers }, { data: atts }, { data: qs }] = await Promise.all([
      supabase.from('meetings').select('*').eq('id', id).single(),
      supabase.from('members').select('id, name, pin').order('name'),
      supabase.from('meeting_attendees').select('member_id').eq('meeting_id', id),
      supabase.from('questions').select('*').eq('meeting_id', id).order('created_at'),
    ]);
    setMeeting(mtg);
    setMembers(allMembers || []);
    setAttendeeIds(new Set((atts || []).map(a => a.member_id)));
    const qIds = (qs || []).map(q => q.id);
    let voteCounts: Record<string, number> = {};
    if (qIds.length > 0) {
      const { data: votes } = await supabase.from('question_votes').select('question_id').in('question_id', qIds);
      (votes || []).forEach(v => { voteCounts[v.question_id] = (voteCounts[v.question_id] || 0) + 1; });
    }
    setQuestions((qs || []).map(q => ({ ...q, voted_count: voteCounts[q.id] || 0 })));
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const hasVoting = questions.some(q => q.status === 'voting');
    if (!hasVoting) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [questions, load]);

  const toggleAttendee = async (memberId: string) => {
    if (!id) return;
    if (attendeeIds.has(memberId)) {
      await supabase.from('meeting_attendees').delete().eq('meeting_id', id).eq('member_id', memberId);
      setAttendeeIds(prev => { const s = new Set(prev); s.delete(memberId); return s; });
    } else {
      await supabase.from('meeting_attendees').insert({ meeting_id: id, member_id: memberId });
      setAttendeeIds(prev => new Set(prev).add(memberId));
    }
  };

  const selectAll = async () => {
    if (!id) return;
    const toAdd = members.filter(m => !attendeeIds.has(m.id));
    if (toAdd.length > 0) {
      await supabase.from('meeting_attendees').insert(toAdd.map(m => ({ meeting_id: id, member_id: m.id })));
    }
    setAttendeeIds(new Set(members.map(m => m.id)));
  };

  const addQuestion = async () => {
    if (!newQuestion.trim() || !id) return;
    await supabase.from('questions').insert({ meeting_id: id, text: newQuestion.trim() });
    setNewQuestion('');
    toast.success(t('question_added'));
    load();
  };

  const deleteQuestion = async (qId: string) => {
    if (!confirm(t('delete_question_confirm'))) return;
    await supabase.from('questions').delete().eq('id', qId);
    load();
  };

  const startVoting = async (qId: string) => {
    if (attendeeIds.size === 0) { toast.error(t('select_attendees_first')); return; }
    await supabase.from('questions').update({ status: 'voting' }).eq('id', qId);
    toast.success(t('voting_started'));
    load();
  };

  const stopVoting = async (qId: string) => {
    await supabase.from('questions').update({ status: 'closed' }).eq('id', qId);
    toast.success(t('voting_stopped'));
    load();
  };

  const handleReport = async () => {
    if (!meeting) return;
    const attendeeMembers = members.filter(m => attendeeIds.has(m.id));
    const closedQuestions = questions.filter(q => q.status === 'closed');
    await generateReport({
      protocolNumber: meeting.protocol_number,
      date: meeting.meeting_date,
      attendees: attendeeMembers.map(m => m.name),
      questions: closedQuestions.map(q => ({
        text: q.text, votes_for: q.votes_for, votes_against: q.votes_against, votes_abstain: q.votes_abstain,
      })),
      lang,
    });
    toast.success(t('report_downloaded'));
  };

  const verdict = (q: Question) => {
    if (q.votes_for > q.votes_against) return t('accepted');
    if (q.votes_for < q.votes_against) return t('rejected');
    return t('tie');
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>;
  if (!meeting) return <div className="text-center py-12">{t('meeting_not_found')}</div>;

  const statusIcon = (s: string) => s === 'draft' ? '📝' : s === 'voting' ? '🟢' : '🔴';
  const pagedMembers = members.slice(attendeePage * PER_PAGE, (attendeePage + 1) * PER_PAGE);
  const totalPages = Math.ceil(members.length / PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t('meeting_label')} №{meeting.protocol_number}</h2>
          <p className="text-sm text-muted-foreground">{meeting.meeting_date}</p>
        </div>
        <Button variant="outline" onClick={handleReport} disabled={questions.filter(q => q.status === 'closed').length === 0}>
          📄 {t('download_report')} (DOCX)
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('attendees')} ({attendeeIds.size} / {members.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={selectAll}>{t('select_all')}</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {pagedMembers.map(m => (
              <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                <Checkbox checked={attendeeIds.has(m.id)} onCheckedChange={() => toggleAttendee(m.id)} />
                <span className="text-sm">{m.name}</span>
              </label>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex gap-2 mt-3 justify-center">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button key={i} variant={attendeePage === i ? 'default' : 'outline'} size="sm" onClick={() => setAttendeePage(i)}>{i + 1}</Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('questions')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder={t('new_question_placeholder')} value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="flex-1" />
            <Button onClick={addQuestion}>{t('add')}</Button>
          </div>
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('no_questions')}</p>
          ) : (
            <div className="space-y-3">
              {questions.map(q => (
                <Card key={q.id} className="border">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="mr-2">{statusIcon(q.status)}</span>
                        <span className="font-medium">{q.text}</span>
                      </div>
                      {q.status === 'draft' && (
                        <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => deleteQuestion(q.id)}>🗑️</Button>
                      )}
                    </div>
                    {q.status === 'draft' && (
                      <Button size="sm" onClick={() => startVoting(q.id)} disabled={attendeeIds.size === 0}>
                        ▶️ {t('start_voting')}
                      </Button>
                    )}
                    {q.status === 'voting' && (
                      <div className="space-y-2">
                        <VoteBar votesFor={q.votes_for} votesAgainst={q.votes_against} votesAbstain={q.votes_abstain} />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {q.voted_count} / {attendeeIds.size} {t('voted')}
                          </span>
                          <Button size="sm" variant="destructive" onClick={() => stopVoting(q.id)}>
                            ⏹️ {t('stop_voting')} ({attendeeIds.size - q.voted_count} {t('not_voted')})
                          </Button>
                        </div>
                      </div>
                    )}
                    {q.status === 'closed' && (
                      <div className="space-y-2">
                        <VoteBar votesFor={q.votes_for} votesAgainst={q.votes_against} votesAbstain={q.votes_abstain} />
                        <div className={`text-sm font-bold ${
                          q.votes_for > q.votes_against ? 'text-emerald-600' :
                          q.votes_for < q.votes_against ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {verdict(q)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
