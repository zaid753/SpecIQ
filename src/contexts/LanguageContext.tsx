import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    projects: "Projects",
    dataSources: "Data Sources",
    aiWorkspace: "AI Workspace",
    documents: "Documents",
    settings: "Settings",
    logout: "Logout",
    welcome: "Welcome back",
    search: "Search...",
    getStarted: "Get Started",
    onboardingTitle: "Complete Your Profile",
    fullName: "Full Name",
    jobRole: "Job Role / Designation",
    company: "Company / Organization",
    language: "Preferred Language",
    save: "Save Profile",
    skip: "Skip for now",
    emptyProjects: "No projects yet. Start by creating your first project.",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    projects: "परियोजनाएं",
    dataSources: "डेटा स्रोत",
    aiWorkspace: "AI कार्यक्षेत्र",
    documents: "दस्तावेज़",
    settings: "सेटिंग्स",
    logout: "लॉग आउट",
    welcome: "स्वागत है",
    search: "खोजें...",
    getStarted: "शुरू करें",
    onboardingTitle: "अपनी प्रोफ़ाइल पूरी करें",
    fullName: "पूरा नाम",
    jobRole: "कार्य भूमिका / पद",
    company: "कंपनी / संगठन",
    language: "पसंदीदा भाषा",
    save: "प्रोफ़ाइल सहेजें",
    skip: "अभी छोड़ें",
    emptyProjects: "अभी तक कोई परियोजना नहीं है। अपनी पहली परियोजना बनाकर शुरू करें।",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("language") as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
