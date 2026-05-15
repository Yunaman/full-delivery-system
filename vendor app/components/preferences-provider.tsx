"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemeMode = "light" | "dark";
type Language = "en" | "am";
type Currency = "ETB" | "USD";

type PreferencesContextType = {
  theme: ThemeMode;
  setTheme: (value: ThemeMode) => void;
  language: Language;
  setLanguage: (value: Language) => void;
  currency: Currency;
  setCurrency: (value: Currency) => void;
  formatMoney: (value: number) => string;
  t: (en: string, am: string) => string;
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

function moneyFormatter(currency: Currency) {
  return new Intl.NumberFormat(currency === "ETB" ? "am-ET" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("ETB");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo<PreferencesContextType>(
    () => ({
      theme,
      setTheme,
      language,
      setLanguage,
      currency,
      setCurrency,
      formatMoney: (amount: number) => moneyFormatter(currency).format(amount),
      t: (en: string, am: string) => (language === "am" ? am : en),
    }),
    [theme, language, currency]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider");
  }
  return context;
}
