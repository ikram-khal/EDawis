import { useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { isAdmin, clearAdmin } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import edawisLogo from '@/assets/edawis-logo.png';

export default function AdminLayout() {
  const navigate = useNavigate();
  const admin = isAdmin();
  const { t } = useI18n();

  useEffect(() => {
    if (!admin) navigate('/');
  }, [admin, navigate]);

  if (!admin) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
    }`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={edawisLogo} alt="EDawis" className="w-8 h-8" />
              <h1 className="font-bold text-lg">EDawis</h1>
            </div>
            <nav className="flex gap-1">
              <NavLink to="/admin" end className={linkClass}>{t('dashboard')}</NavLink>
              <NavLink to="/admin/members" className={linkClass}>{t('members')}</NavLink>
              <NavLink to="/admin/meetings" className={linkClass}>{t('meetings')}</NavLink>
              <NavLink to="/admin/settings" className={linkClass}>{t('settings')}</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={() => { clearAdmin(); navigate('/'); }}>
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
