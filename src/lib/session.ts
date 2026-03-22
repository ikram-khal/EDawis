const SESSION_KEY = 'nspi_session_id';
const MEMBER_KEY = 'nspi_member';
const ADMIN_KEY = 'nspi_admin';
const ADMIN_USER_KEY = 'nspi_admin_user';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function setMember(member: { id: string; name: string; pin: string }) {
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
}

export function getMember(): { id: string; name: string; pin: string } | null {
  const raw = localStorage.getItem(MEMBER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearMember() {
  localStorage.removeItem(MEMBER_KEY);
}

export function setAdmin(isAdmin: boolean, username?: string) {
  if (isAdmin) {
    localStorage.setItem(ADMIN_KEY, 'true');
    if (username) localStorage.setItem(ADMIN_USER_KEY, username);
  } else {
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }
}

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

export function getAdminUsername(): string {
  return localStorage.getItem(ADMIN_USER_KEY) || '';
}

export function clearAdmin() {
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}
