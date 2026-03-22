import { useI18n, Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex gap-1">
      {(['qq', 'ru'] as Lang[]).map((l) => (
        <Button
          key={l}
          variant={lang === l ? 'default' : 'ghost'}
          size="sm"
          className="text-xs px-2 h-7"
          onClick={() => setLang(l)}
        >
          {l === 'qq' ? 'QQ' : 'RU'}
        </Button>
      ))}
    </div>
  );
}
