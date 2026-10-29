export interface EmojiItem {
  emoji: string;
  name: string;
  category: 'work' | 'status' | 'creative' | 'life';
  keywords: string[];
}

/**
 * Extract the first user-perceived grapheme cluster without splitting multi-byte/surrogate/ZWJ emojis.
 */
export function getFirstGrapheme(text: string): string {
  if (!text) return '';
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(text));
    return segments[0]?.segment || '';
  }
  return Array.from(text)[0] || '';
}

export const EMOJI_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'work', label: 'Work' },
  { id: 'status', label: 'Status' },
  { id: 'creative', label: 'Creative' },
  { id: 'life', label: 'Life' },
] as const;

export type EmojiCategoryId = (typeof EMOJI_CATEGORIES)[number]['id'];

export const CURATED_EMOJIS: EmojiItem[] = [
  // Work & Dev
  { emoji: '🚀', name: 'Rocket', category: 'work', keywords: ['launch', 'ship', 'fast', 'startup', 'rocket'] },
  { emoji: '💻', name: 'Laptop', category: 'work', keywords: ['computer', 'code', 'dev', 'programming', 'laptop'] },
  { emoji: '⚡', name: 'Lightning', category: 'work', keywords: ['fast', 'electric', 'energy', 'zap', 'lightning'] },
  { emoji: '🛠️', name: 'Hammer & Wrench', category: 'work', keywords: ['tools', 'build', 'fix', 'hardware', 'dev'] },
  { emoji: '🎯', name: 'Target', category: 'work', keywords: ['goal', 'focus', 'objective', 'aim', 'dart'] },
  { emoji: '📊', name: 'Bar Chart', category: 'work', keywords: ['analytics', 'metrics', 'stats', 'data', 'chart'] },
  { emoji: '📝', name: 'Memo', category: 'work', keywords: ['note', 'write', 'document', 'todo', 'paper'] },
  { emoji: '🔧', name: 'Wrench', category: 'work', keywords: ['tool', 'settings', 'fix', 'maintain'] },
  { emoji: '🔍', name: 'Magnifier', category: 'work', keywords: ['search', 'find', 'explore', 'audit', 'inspect'] },
  { emoji: '📁', name: 'Folder', category: 'work', keywords: ['directory', 'files', 'organize', 'archive'] },
  { emoji: '📦', name: 'Package', category: 'work', keywords: ['box', 'release', 'deploy', 'bundle', 'cargo'] },
  { emoji: '💡', name: 'Lightbulb', category: 'work', keywords: ['idea', 'creative', 'innovation', 'smart'] },
  { emoji: '⏱️', name: 'Stopwatch', category: 'work', keywords: ['timer', 'time', 'clock', 'track', 'elapsed'] },
  { emoji: '📋', name: 'Clipboard', category: 'work', keywords: ['list', 'task', 'checklist', 'plan'] },
  { emoji: '📌', name: 'Pushpin', category: 'work', keywords: ['pin', 'mark', 'important', 'notice'] },
  { emoji: '⚙️', name: 'Gear', category: 'work', keywords: ['settings', 'config', 'engine', 'machine'] },

  // Status & Indicators
  { emoji: '✅', name: 'Check', category: 'status', keywords: ['done', 'ok', 'complete', 'success', 'pass'] },
  { emoji: '⚠️', name: 'Warning', category: 'status', keywords: ['alert', 'caution', 'attention', 'warn'] },
  { emoji: '🚨', name: 'Siren', category: 'status', keywords: ['emergency', 'urgent', 'critical', 'danger', 'bug'] },
  { emoji: '🛑', name: 'Stop', category: 'status', keywords: ['halt', 'blocked', 'pause', 'barrier'] },
  { emoji: '🚩', name: 'Flag', category: 'status', keywords: ['milestone', 'marker', 'red flag', 'goal'] },
  { emoji: '🟢', name: 'Green Circle', category: 'status', keywords: ['online', 'active', 'healthy', 'live'] },
  { emoji: '🟡', name: 'Yellow Circle', category: 'status', keywords: ['pending', 'idle', 'in progress', 'waiting'] },
  { emoji: '🔴', name: 'Red Circle', category: 'status', keywords: ['offline', 'error', 'failed', 'stopped'] },
  { emoji: '🔵', name: 'Blue Circle', category: 'status', keywords: ['info', 'neutral', 'state'] },
  { emoji: '🟣', name: 'Purple Circle', category: 'status', keywords: ['special', 'flow', 'violet'] },
  { emoji: '🔒', name: 'Lock', category: 'status', keywords: ['security', 'private', 'auth', 'secret'] },
  { emoji: '🔑', name: 'Key', category: 'status', keywords: ['access', 'token', 'key', 'login'] },

  // Creative & Media
  { emoji: '🎨', name: 'Palette', category: 'creative', keywords: ['design', 'art', 'ui', 'color', 'paint'] },
  { emoji: '🎭', name: 'Theater', category: 'creative', keywords: ['acting', 'play', 'entertainment', 'show'] },
  { emoji: '🎬', name: 'Clapper', category: 'creative', keywords: ['video', 'film', 'movie', 'production'] },
  { emoji: '📷', name: 'Camera', category: 'creative', keywords: ['photo', 'snapshot', 'capture', 'image'] },
  { emoji: '🎵', name: 'Musical Note', category: 'creative', keywords: ['music', 'audio', 'sound', 'song'] },
  { emoji: '🎸', name: 'Guitar', category: 'creative', keywords: ['music', 'instrument', 'rock'] },
  { emoji: '✍️', name: 'Writing Hand', category: 'creative', keywords: ['write', 'author', 'compose', 'blog'] },
  { emoji: '🌟', name: 'Glowing Star', category: 'creative', keywords: ['favorite', 'star', 'featured', 'best'] },
  { emoji: '✨', name: 'Sparkles', category: 'creative', keywords: ['magic', 'clean', 'ai', 'new', 'shine'] },
  { emoji: '🔮', name: 'Crystal Ball', category: 'creative', keywords: ['future', 'vision', 'roadmap', 'ai'] },
  { emoji: '💎', name: 'Gem Stone', category: 'creative', keywords: ['quality', 'premium', 'diamond', 'clean'] },

  // Life & Personal
  { emoji: '☕', name: 'Coffee', category: 'life', keywords: ['break', 'tea', 'drink', 'morning', 'cafe'] },
  { emoji: '💼', name: 'Briefcase', category: 'life', keywords: ['business', 'client', 'work', 'job'] },
  { emoji: '🏠', name: 'House', category: 'life', keywords: ['home', 'personal', 'chores', 'family'] },
  { emoji: '🏋️', name: 'Gym', category: 'life', keywords: ['fitness', 'workout', 'exercise', 'health'] },
  { emoji: '🚴', name: 'Bicycle', category: 'life', keywords: ['bike', 'cycling', 'commute', 'sport'] },
  { emoji: '🌴', name: 'Palm Tree', category: 'life', keywords: ['vacation', 'holiday', 'leave', 'rest', 'beach'] },
  { emoji: '🍕', name: 'Pizza', category: 'life', keywords: ['food', 'lunch', 'dinner', 'snack'] },
  { emoji: '✈️', name: 'Airplane', category: 'life', keywords: ['travel', 'trip', 'flight', 'abroad'] },
  { emoji: '📚', name: 'Books', category: 'life', keywords: ['reading', 'study', 'education', 'research'] },
  { emoji: '🎓', name: 'Graduation Cap', category: 'life', keywords: ['degree', 'learn', 'knowledge', 'course'] },
];
