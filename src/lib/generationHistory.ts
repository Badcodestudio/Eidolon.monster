export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  prompt: string;
  title: string;
  style: string;
  clothing: string;
  pantheon?: string;
  aspectRatio: string;
}

import { scopedKey } from '@/lib/userScope';

const BASE_KEY = 'eidolon_generation_history';
const storageKey = () => scopedKey(BASE_KEY);

export function getGenerationHistory(): GenerationHistoryItem[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveToGenerationHistory(item: Omit<GenerationHistoryItem, 'id' | 'timestamp'>) {
  try {
    const current = getGenerationHistory();
    const newItem: GenerationHistoryItem = {
      ...item,
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    // Keep up to 100 recent generations
    const updated = [newItem, ...current].slice(0, 100);
    localStorage.setItem(storageKey(), JSON.stringify(updated));
    window.dispatchEvent(new Event('eidolon_history_updated'));
  } catch {
    // fallback
  }
}

export function clearGenerationHistory() {
  localStorage.removeItem(storageKey());
  window.dispatchEvent(new Event('eidolon_history_updated'));
}

export function removeHistoryItem(id: string) {
  try {
    const current = getGenerationHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(storageKey(), JSON.stringify(updated));
    window.dispatchEvent(new Event('eidolon_history_updated'));
  } catch {
    // fallback
  }
}
