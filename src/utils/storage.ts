import { Apartment } from '../types';
import { INITIAL_APARTMENTS } from '../data/initialData';

const STORAGE_KEY = 'cyclon_apartments_v6';
const ACTIVE_APT_KEY = 'cyclon_active_apt_id_v6';
const ACTIVE_MEMBER_KEY = 'cyclon_active_member_id_v6';
const AUTHORIZED_APTS_KEY = 'cyclon_authorized_apartments_v6';
const PREVIOUS_SESSION_KEY = 'cyclon_previous_session_apt_id_v6';

export function getPreviousSessionApartmentId(): string | null {
  try {
    const saved = localStorage.getItem(PREVIOUS_SESSION_KEY);
    if (saved) return saved;
    // Fallback to active apartment only if explicitly set in localStorage
    const active = localStorage.getItem(ACTIVE_APT_KEY);
    return active || null;
  } catch (e) {
    return null;
  }
}

export function savePreviousSessionApartmentId(aptId: string | null): void {
  try {
    if (aptId) {
      localStorage.setItem(PREVIOUS_SESSION_KEY, aptId);
      localStorage.setItem(ACTIVE_APT_KEY, aptId);
    } else {
      localStorage.removeItem(PREVIOUS_SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to save previous session:', e);
  }
}

export function clearPreviousSession(): void {
  try {
    localStorage.removeItem(PREVIOUS_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear previous session:', e);
  }
}

export function getNextAvailableApartmentNumber(apartments: Apartment[]): number {
  if (!apartments || apartments.length === 0) return 101;
  const numbers = apartments.map((a) => a.apartmentNumber).filter((n) => typeof n === 'number' && !isNaN(n));
  if (numbers.length === 0) return 101;
  return Math.max(...numbers) + 1;
}

export function getAuthorizedApartmentIds(): string[] {
  try {
    const data = localStorage.getItem(AUTHORIZED_APTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load authorized apartments:', e);
  }
  // Default to apt-101 for demo convenience
  return ['apt-101'];
}

export function saveAuthorizedApartmentIds(ids: string[]): void {
  try {
    localStorage.setItem(AUTHORIZED_APTS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save authorized apartments:', e);
  }
}

export function authorizeApartment(aptId: string): void {
  const current = getAuthorizedApartmentIds();
  if (!current.includes(aptId)) {
    saveAuthorizedApartmentIds([...current, aptId]);
  }
}

export function deauthorizeApartment(aptId: string): void {
  const current = getAuthorizedApartmentIds();
  saveAuthorizedApartmentIds(current.filter((id) => id !== aptId));
}

const INITIALIZED_FLAG_KEY = 'cyclon_initialized_flag_v7';

export function loadApartments(): Apartment[] {
  try {
    const isInitialized = localStorage.getItem(INITIALIZED_FLAG_KEY);
    const data = localStorage.getItem(STORAGE_KEY);
    
    // If the storage was already initialized, respect whatever is stored, even an empty array []
    if (isInitialized && data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    if (data) {
      const parsed: Apartment[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load apartments from localStorage:', e);
  }
  // Initialize with initial apartments on very first run
  saveApartments(INITIAL_APARTMENTS);
  localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
  return INITIAL_APARTMENTS;
}

export function saveApartments(apartments: Apartment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apartments));
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
  } catch (e) {
    console.error('Failed to save apartments to localStorage:', e);
  }
}

export function clearAllApartments(): void {
  try {
    saveApartments([]);
    localStorage.removeItem(ACTIVE_APT_KEY);
    localStorage.removeItem(PREVIOUS_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear apartments from localStorage:', e);
  }
}

export function getActiveApartmentId(): string {
  return localStorage.getItem(ACTIVE_APT_KEY) || 'apt-101';
}

export function setActiveApartmentId(id: string): void {
  localStorage.setItem(ACTIVE_APT_KEY, id);
}

export function getActiveMemberId(aptId: string): string {
  const stored = localStorage.getItem(`${ACTIVE_MEMBER_KEY}_${aptId}`);
  if (stored) return stored;
  return 'member-max'; // default for apartment 101
}

export function setActiveMemberId(aptId: string, memberId: string): void {
  localStorage.setItem(`${ACTIVE_MEMBER_KEY}_${aptId}`, memberId);
}
