/**
 * Theme persistence shared by the toggle component and the head boot script.
 * The boot script is inlined separately (see BaseLayout) because it must run
 * before first paint; this module is the bundled, hashed version for runtime.
 */
export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function getResolvedTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable (private mode, disabled). The choice still applies for this page.
  }
}
