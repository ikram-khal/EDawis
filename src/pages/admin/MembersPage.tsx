import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { parseXlsx, downloadTemplate } from '@/lib/xlsx-utils';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

interface Member { id: string; name: string; pin: string; session_id: string | null; }

export default function MembersPage() {
  const { t } = useI18n();
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const generatePin = (fullName: string, existingPins: Set<string>): string => {
    const parts = fullName.trim().split(/\s+/);
    const initials = parts.map(p => p[0]?.toUpperCase() || '').join('');
    const prefix = initials || 'X';
    let pin = '';
    let attempts = 0;
    do {
      const num = String(Math.floor(1000 + Math.random() * 9000));
      pin = prefix + num;
      attempts++;
    } while (existingPins.has(pin) && attempts < 100);
    return pin;
  };

  const load = async () => {
    const { data } = await supabase.from('members').select('*').order('name');
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addMember = async () => {
    if (!name.trim()) return;
    const existingPins = new Set(members.map(m => m.pin));
    const pin = generatePin(name.trim(), existingPins);
    const { error } = await supabase.from('members').insert({ name: name.trim(), pin });
    if (error) {
      toast.error(error.message.includes('duplicate') ? t('duplicate_pin') : error.message);
      return;
    }
    toast.success(t('member_added') + ' — PIN: ' + pin);
    setName('');
    load();
  };

  const deleteMember = async (id: string, memberName: string) => {
    if (!confirm(`"${memberName}" — ${t('delete_member_confirm')}`)) return;
    await supabase.from('members').delete().eq('id', id);
    toast.success(t('deleted'));
    load();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const existingPins = new Set(members.map(m => m.pin));
      const existingNames = new Set(members.map(m => m.name.toLowerCase()));
      const parsed = await parseXlsx(file, existingPins);
      const toAdd = parsed.filter(p => !existingNames.has(p.name.toLowerCase()));
      const skipped = parsed.length - toAdd.length;
      if (toAdd.length > 0) {
        const { error } = await supabase.from('members').insert(toAdd);
        if (error) throw error;
      }
      toast.success(t('import_result', { added: toAdd.length, skipped }));
      load();
    } catch (err: any) {
      toast.error(err.message || t('import_error'));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('members')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>📥 {t('download_template')}</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>📤 {t('upload_xlsx')}</Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileImport} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('add_member')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder={t('full_name')} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMember()} className="flex-1" />
            <Button onClick={addMember}>{t('add')}</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">PIN код автоматик жаратылады (мыс. BAQ1234)</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{t('loading')}</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t('no_members')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{t('full_name')}</TableHead>
                  <TableHead className="w-24">PIN</TableHead>
                  <TableHead className="w-24">{t('status')}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m, i) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="font-mono">{m.pin}</TableCell>
                    <TableCell>{m.session_id ? '✅' : '⏳'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMember(m.id, m.name)}>🗑️</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
