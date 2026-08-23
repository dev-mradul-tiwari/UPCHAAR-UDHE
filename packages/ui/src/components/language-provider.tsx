"use client";

import * as React from "react";

export type Language = "en" | "hi";

export interface Translations {
  // Common Nav & App Titles
  dashboard: string;
  dashboard_desc: string;
  find_care: string;
  find_care_desc: string;
  appointments: string;
  appointments_desc: string;
  health_records: string;
  health_records_desc: string;
  dr_positive: string;
  dr_positive_desc: string;
  medicine_check: string;
  medicine_check_desc: string;

  // Actions & Common Buttons
  sign_out: string;
  sign_in: string;
  register: string;
  book_appointment: string;
  cancel: string;
  save: string;
  edit: string;
  loading: string;
  back: string;

  // Queue & Clinical
  token_number: string;
  ahead_of_you: string;
  estimated_wait: string;
  now_serving: string;
  position_in_queue: string;
  live_queue: string;
  call_next: string;
  complete_consultation: string;
  minutes: string;
  patients: string;

  // Statuses
  confirmed: string;
  in_progress: string;
  completed: string;
  cancelled: string;
  pending: string;

  // Hospital & Doctor Portal
  queue_console: string;
  queue_console_desc: string;
  doctors: string;
  doctors_desc: string;
  beds: string;
  beds_desc: string;
  overview: string;
  overview_desc: string;
  patient_care: string;
  hospital_admin: string;
  doctor_portal: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common Nav & App Titles
    dashboard: "Dashboard",
    dashboard_desc: "Your day at a glance",
    find_care: "Find care",
    find_care_desc: "Search hospitals and beds",
    appointments: "Appointments",
    appointments_desc: "Bookings and live queue",
    health_records: "Health records",
    health_records_desc: "Your medical history",
    dr_positive: "Dr. Positive",
    dr_positive_desc: "Calm, guided answers",
    medicine_check: "Medicine check",
    medicine_check_desc: "Drug interaction report",

    // Actions & Common Buttons
    sign_out: "Sign out",
    sign_in: "Sign in",
    register: "Register",
    book_appointment: "Book appointment",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    loading: "Loading...",
    back: "Back",

    // Queue & Clinical
    token_number: "Token number",
    ahead_of_you: "Ahead of you",
    estimated_wait: "Estimated wait",
    now_serving: "Now serving",
    position_in_queue: "Your position in queue",
    live_queue: "Live queue",
    call_next: "Call next patient",
    complete_consultation: "Complete consultation",
    minutes: "min",
    patients: "patients",

    // Statuses
    confirmed: "Confirmed",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending",

    // Hospital & Doctor Portal
    queue_console: "Queue console",
    queue_console_desc: "Manage live patient queue",
    doctors: "Doctors",
    doctors_desc: "Manage hospital medical staff",
    beds: "Bed allocation",
    beds_desc: "Manage hospital bed capacity",
    overview: "Overview",
    overview_desc: "Hospital performance and metrics",
    patient_care: "PATIENT CARE",
    hospital_admin: "HOSPITAL ADMIN",
    doctor_portal: "DOCTOR PORTAL",
  },
  hi: {
    // Common Nav & App Titles
    dashboard: "डैशबोर्ड",
    dashboard_desc: "आपका दिन एक नज़र में",
    find_care: "अस्पताल खोजें",
    find_care_desc: "अस्पताल और बेड खोजें",
    appointments: "अपॉइंटमेंट",
    appointments_desc: "बुकिंग और लाइव कतार",
    health_records: "स्वास्थ्य रिकॉर्ड",
    health_records_desc: "आपका चिकित्सा इतिहास",
    dr_positive: "डॉ. पॉजिटिव",
    dr_positive_desc: "शांत, निर्देशित उत्तर",
    medicine_check: "दवा जांच",
    medicine_check_desc: "दवा पारस्परिक क्रिया रिपोर्ट",

    // Actions & Common Buttons
    sign_out: "साइन आउट",
    sign_in: "साइन इन",
    register: "पंजीकरण करें",
    book_appointment: "अपॉइंटमेंट बुक करें",
    cancel: "रद्द करें",
    save: "सहेजें",
    edit: "संपादित करें",
    loading: "लोड हो रहा है...",
    back: "वापस जाएं",

    // Queue & Clinical
    token_number: "टोकन नंबर",
    ahead_of_you: "आपसे आगे मरीज",
    estimated_wait: "अनुमानित प्रतीक्षा",
    now_serving: "वर्तमान सेवा",
    position_in_queue: "कतार में आपकी स्थिति",
    live_queue: "लाइव कतार",
    call_next: "अगले मरीज को बुलाएं",
    complete_consultation: "परामर्श पूर्ण करें",
    minutes: "मिनट",
    patients: "मरीज",

    // Statuses
    confirmed: "पुष्ट (Confirmed)",
    in_progress: "जारी (In Progress)",
    completed: "पूर्ण (Completed)",
    cancelled: "रद्द (Cancelled)",
    pending: "लंबित (Pending)",

    // Hospital & Doctor Portal
    queue_console: "कतार कंसोल",
    queue_console_desc: "लाइव मरीज कतार प्रबंधित करें",
    doctors: "डॉक्टर सूची",
    doctors_desc: "अस्पताल के डॉक्टर प्रबंधित करें",
    beds: "बेड आवंटन",
    beds_desc: "अस्पताल बेड क्षमता प्रबंधित करें",
    overview: "ओवरव्यू",
    overview_desc: "अस्पताल का प्रदर्शन और आंकड़े",
    patient_care: "मरीज सेवा (PATIENT CARE)",
    hospital_admin: "अस्पताल प्रशासन (HOSPITAL ADMIN)",
    doctor_portal: "डॉक्टर पोर्टल (DOCTOR PORTAL)",
  },
};

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export const DEFAULT_LANGUAGE_STORAGE_KEY = "upchaar-language";

export interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
}

export function LanguageProvider({
  children,
  defaultLanguage = "en",
  storageKey = DEFAULT_LANGUAGE_STORAGE_KEY,
}: LanguageProviderProps) {
  const [language, setLanguageState] = React.useState<Language>(defaultLanguage);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Language | null;
      if (stored === "en" || stored === "hi") {
        setLanguageState(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  const setLanguage = React.useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      try {
        localStorage.setItem(storageKey, lang);
      } catch {
        // Ignore localStorage errors
      }
    },
    [storageKey],
  );

  const toggleLanguage = React.useCallback(() => {
    setLanguage(language === "en" ? "hi" : "en");
  }, [language, setLanguage]);

  const t = React.useCallback(
    (key: keyof Translations): string => {
      return translations[language]?.[key] ?? translations.en[key] ?? key;
    },
    [language],
  );

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, setLanguage, toggleLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = React.useContext(LanguageContext);
  if (!context) {
    // Fallback if context is not mounted
    return {
      language: "en",
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: keyof Translations) => translations.en[key] ?? key,
    };
  }
  return context;
}
