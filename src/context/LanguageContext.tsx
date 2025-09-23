import React, { createContext, useState, useContext, ReactNode } from 'react';

// FIX: Changed `Language` from a type alias to an enum to resolve the error
// "'Language' only refers to a type, but is being used as a value here."
// An enum provides both a type and a runtime object, which is necessary
// if the type is being accessed for its values (e.g., Language.CH).
export enum Language {
  EN = 'en',
  CH = 'ch',
}

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  autoRefresh: boolean;
  setAutoRefresh: (autoRefresh: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(Language.CH);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, autoRefresh, setAutoRefresh }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
