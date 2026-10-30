// Browser-saved lists (My Creations, History, last generated image) used to be shared by everyone who used
// the same browser. These helpers keep a separate copy per signed-in account.
import { getCurrentUser } from '@/components/AuthModal';

// The owner's existing saves (made before accounts were separated) move over to this account once.
const OWNER_EMAIL = 'contact@eidolon.monster';

function who(): string {
  return (getCurrentUser()?.email || 'guest').toLowerCase();
}

export function scopedKey(base: string): string {
  const key = `${base}:${who()}`;
  try {
    if (who() === OWNER_EMAIL && localStorage.getItem(key) === null) {
      const legacy = localStorage.getItem(base);
      if (legacy !== null) localStorage.setItem(key, legacy);
    }
  } catch {
    // storage unavailable
  }
  return key;
}
