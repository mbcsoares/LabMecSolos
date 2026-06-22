import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';

const THEME_KEY = 'theme_mode';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const applyTheme = (dark: boolean) => {
  document.body.classList.toggle('dark', dark);
};

const persistTheme = async (dark: boolean) => {
  try {
    await Preferences.set({ key: THEME_KEY, value: dark ? 'dark' : 'light' });
  } catch {}
};

const loadTheme = async (): Promise<boolean> => {
  try {
    const { value } = await Preferences.get({ key: THEME_KEY });
    return value === 'dark';
  } catch {
    return false;
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme().then((dark) => {
      setIsDark(dark);
      applyTheme(dark);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      persistTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
