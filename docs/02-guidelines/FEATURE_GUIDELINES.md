# Feature Guidelines - Field Force CRM

**Version**: 1.0
**Last Updated**: 2025-10-05
**Purpose**: Implementation standards for specific features

---

## Table of Contents

1. [Mobile & PWA](#1-mobile--pwa)
2. [Offline Mode](#2-offline-mode)
3. [Internationalization (i18n)](#3-internationalization-i18n)
4. [Voice Input](#4-voice-input)
5. [SMS/Email/WhatsApp](#5-smsemailwhatsapp)
6. [Feature Flags](#6-feature-flags)
7. [Accessibility (A11y)](#7-accessibility-a11y)
8. [Analytics & Tracking](#8-analytics--tracking)
9. [Search & Filtering](#9-search--filtering)
10. [File Upload](#10-file-upload)
11. [Notifications](#11-notifications)
12. [Maps & GPS](#12-maps--gps)

---

## 1. Mobile & PWA

### 1.1 Progressive Web App Setup

**Install Dependencies**:
```bash
cd web
npm install vite-plugin-pwa workbox-window
```

**Configure Vite PWA**:
```typescript
// web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Field Force CRM',
        short_name: 'FFCRM',
        description: 'GPS-verified visit tracking for sales teams',
        theme_color: '#0d9488', // Teal-600
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.yourapp\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 1.2 Mobile-First Responsive Design

**Touch Target Sizes** (Minimum 44x44px):
```tsx
// ✅ Good - 44x44px touch targets
<button className="w-12 h-12 flex items-center justify-center">
  <PlusIcon className="w-6 h-6" />
</button>

// ❌ Bad - Too small (32x32px)
<button className="w-8 h-8">
  <PlusIcon className="w-4 h-4" />
</button>
```

**Mobile Navigation**:
```tsx
// web/src/components/MobileNav.tsx
export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        <NavItem icon={HomeIcon} label="Home" to="/" />
        <NavItem icon={UserGroupIcon} label="Contacts" to="/contacts" />
        <NavItem icon={MapPinIcon} label="Visits" to="/visits" />
        <NavItem icon={ShoppingCartIcon} label="Orders" to="/orders" />
      </div>
    </nav>
  );
}

function NavItem({ icon: Icon, label, to }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center w-full h-full ${
        isActive ? 'text-teal-600' : 'text-gray-600'
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}
```

### 1.3 Install Prompt (Add to Home Screen)

```tsx
// web/src/hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
      return true;
    }

    return false;
  };

  return { promptInstall, canInstall: !!installPrompt, isInstalled };
}
```

### 1.4 Performance Optimization for Mobile

**Lazy Load Images**:
```tsx
<img
  src={imageUrl}
  alt="Visit photo"
  loading="lazy"
  className="w-full h-auto"
/>
```

**Reduce Bundle Size**:
```bash
# Analyze bundle
npm run build -- --analyze

# Target: <500KB gzipped
```

---

## 2. Offline Mode

### 2.1 IndexedDB Storage

**Install localforage**:
```bash
npm install localforage
```

**Configure Storage**:
```typescript
// web/src/utils/offlineStorage.ts
import localforage from 'localforage';

// Contacts cache
export const contactsStore = localforage.createInstance({
  name: 'fieldforce-crm',
  storeName: 'contacts'
});

// Visits cache
export const visitsStore = localforage.createInstance({
  name: 'fieldforce-crm',
  storeName: 'visits'
});

// Pending sync queue
export const syncQueue = localforage.createInstance({
  name: 'fieldforce-crm',
  storeName: 'sync_queue'
});
```

### 2.2 Offline Data Sync

**Cache Data When Online**:
```typescript
// web/src/hooks/useContacts.ts
import { useEffect, useState } from 'react';
import { contactsStore } from '../utils/offlineStorage';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    fetchContacts();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingChanges();
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchContacts = async () => {
    try {
      // Try network first
      const response = await fetch('/api/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts);

        // Cache for offline use
        await contactsStore.setItem('all', data.contacts);
      }
    } catch (error) {
      // Network failed, use cached data
      const cached = await contactsStore.getItem('all');
      if (cached) {
        setContacts(cached as Contact[]);
      }
    } finally {
      setLoading(false);
    }
  };

  return { contacts, loading, isOffline };
}
```

**Queue Changes When Offline**:
```typescript
// web/src/utils/offlineSync.ts
interface SyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'contacts' | 'visits' | 'orders';
  data: any;
  timestamp: number;
}

export const queueForSync = async (item: SyncItem) => {
  const queue = (await syncQueue.getItem('queue')) as SyncItem[] || [];
  queue.push(item);
  await syncQueue.setItem('queue', queue);
};

export const syncPendingChanges = async () => {
  const queue = (await syncQueue.getItem('queue')) as SyncItem[] || [];

  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      await processSync(item);

      // Remove from queue after successful sync
      const updatedQueue = queue.filter(q => q.id !== item.id);
      await syncQueue.setItem('queue', updatedQueue);
    } catch (error) {
      console.error('Sync failed for item:', item, error);
      // Keep in queue to retry later
    }
  }
};

const processSync = async (item: SyncItem) => {
  const url = `/api/${item.resource}${item.type === 'update' ? `/${item.data.id}` : ''}`;
  const method = {
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE'
  }[item.type];

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }
};
```

### 2.3 Offline Indicator

```tsx
// web/src/components/OfflineIndicator.tsx
export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 text-center z-50">
      <CloudOffIcon className="inline w-5 h-5 mr-2" />
      You're offline. Changes will sync when online.
    </div>
  );
}
```

---

## 3. Internationalization (i18n)

### 3.1 Setup i18next

**Install**:
```bash
npm install i18next react-i18next
```

**Configure**:
```typescript
// web/src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import neTranslations from './locales/ne.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      ne: { translation: neTranslations }
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### 3.2 Translation Files

**web/src/i18n/locales/en.json**:
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search"
  },
  "contacts": {
    "title": "Contacts",
    "addContact": "Add Contact",
    "name": "Name",
    "phone": "Phone",
    "email": "Email",
    "type": {
      "doctor": "Doctor",
      "retailer": "Retailer",
      "wholesaler": "Wholesaler"
    }
  },
  "visits": {
    "checkIn": "Check In",
    "checkOut": "Check Out",
    "verified": "Verified",
    "notVerified": "Not Verified"
  }
}
```

**web/src/i18n/locales/hi.json**:
```json
{
  "common": {
    "save": "सहेजें",
    "cancel": "रद्द करें",
    "delete": "हटाएं",
    "edit": "संपादित करें",
    "search": "खोजें"
  },
  "contacts": {
    "title": "संपर्क",
    "addContact": "संपर्क जोड़ें",
    "name": "नाम",
    "phone": "फ़ोन",
    "email": "ईमेल",
    "type": {
      "doctor": "डॉक्टर",
      "retailer": "खुदरा विक्रेता",
      "wholesaler": "थोक विक्रेता"
    }
  }
}
```

### 3.3 Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

export default function ContactForm() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('contacts.title')}</h1>

      <button onClick={() => i18n.changeLanguage('hi')}>
        हिंदी
      </button>

      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>

      <input
        placeholder={t('contacts.name')}
        type="text"
      />

      <button>{t('common.save')}</button>
    </div>
  );
}
```

### 3.4 Language Selector

```tsx
// web/src/components/LanguageSelector.tsx
export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵' }
  ];

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 4. Voice Input

### 4.1 Web Speech API

```typescript
// web/src/hooks/useVoiceInput.ts
import { useState, useEffect } from 'react';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useVoiceInput(language: 'en-IN' | 'hi-IN' = 'en-IN') {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  const startListening = () => {
    if (!isSupported) {
      alert('Voice input is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event);
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}
```

### 4.2 Voice Input Component

```tsx
// web/src/components/VoiceInput.tsx
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: 'en-IN' | 'hi-IN';
}

export default function VoiceInput({ onTranscript, language = 'en-IN' }: VoiceInputProps) {
  const { transcript, isListening, isSupported, startListening } = useVoiceInput(language);

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={startListening}
      className={`p-2 rounded-lg ${
        isListening ? 'bg-red-500 animate-pulse' : 'bg-teal-600 hover:bg-teal-700'
      }`}
      title="Voice input"
    >
      <MicrophoneIcon className="w-5 h-5 text-white" />
    </button>
  );
}

// Usage
export default function NotesField() {
  const [notes, setNotes] = useState('');

  return (
    <div className="relative">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg pr-12"
        rows={4}
      />
      <div className="absolute bottom-2 right-2">
        <VoiceInput
          onTranscript={(text) => setNotes(prev => prev + ' ' + text)}
          language="hi-IN"
        />
      </div>
    </div>
  );
}
```

---

## 5. SMS/Email/WhatsApp

### 5.1 SMS Integration (MSG91)

**Install**:
```bash
npm install axios
```

**Send SMS**:
```typescript
// api/src/services/smsService.ts
import axios from 'axios';

const MSG91_API_KEY = process.env.MSG91_API_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'FFCRM';

export const sendSMS = async ({
  to,
  message
}: {
  to: string;
  message: string;
}) => {
  try {
    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow/',
      {
        sender: MSG91_SENDER_ID,
        route: '4', // Transactional route
        country: '91',
        sms: [
          {
            message: [message],
            to: [to]
          }
        ]
      },
      {
        headers: {
          'authkey': MSG91_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      messageId: response.data.message
    };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

// Payment reminder template
export const sendPaymentReminder = async ({
  phone,
  contactName,
  amount,
  orderNumber
}: {
  phone: string;
  contactName: string;
  amount: number;
  orderNumber: string;
}) => {
  const message = `Dear ${contactName}, your payment of ₹${amount} for order ${orderNumber} is pending. Please pay at your earliest. - Field Force CRM`;

  return sendSMS({ to: phone, message });
};
```

### 5.2 Email Integration (SendGrid)

```typescript
// api/src/services/emailService.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendEmail = async ({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const msg = {
    to,
    from: 'noreply@yourapp.com',
    subject,
    html
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Welcome email template
export const sendWelcomeEmail = async (email: string, name: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0d9488;">Welcome to Field Force CRM!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for signing up. Your account has been created successfully.</p>
        <p>
          <a href="https://yourapp.com/login"
             style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Login to Your Account
          </a>
        </p>
        <p>Best regards,<br>Field Force CRM Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Field Force CRM',
    html
  });
};
```

### 5.3 WhatsApp Integration (Gupshup)

```typescript
// api/src/services/whatsappService.ts
import axios from 'axios';

const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME;

export const sendWhatsAppMessage = async ({
  to,
  message
}: {
  to: string;
  message: string;
}) => {
  try {
    const response = await axios.post(
      'https://api.gupshup.io/sm/api/v1/msg',
      new URLSearchParams({
        channel: 'whatsapp',
        source: GUPSHUP_APP_NAME,
        destination: to,
        'src.name': GUPSHUP_APP_NAME,
        message: JSON.stringify({
          type: 'text',
          text: message
        })
      }),
      {
        headers: {
          'apikey': GUPSHUP_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error('WhatsApp sending failed:', error);
    throw error;
  }
};

// Order approved notification
export const sendOrderApprovedWhatsApp = async ({
  phone,
  orderNumber,
  amount
}: {
  phone: string;
  orderNumber: string;
  amount: number;
}) => {
  const message = `✅ Your order ${orderNumber} for ₹${amount} has been approved. It will be dispatched soon. Thank you!`;

  return sendWhatsAppMessage({ to: phone, message });
};
```

---

## 6. Feature Flags

### 6.1 Simple Feature Flag System

```typescript
// api/src/utils/featureFlags.ts
interface FeatureFlags {
  ENABLE_WHATSAPP: boolean;
  ENABLE_VOICE_INPUT: boolean;
  ENABLE_AI_INSIGHTS: boolean;
  ENABLE_GAMIFICATION: boolean;
}

const flags: FeatureFlags = {
  ENABLE_WHATSAPP: process.env.ENABLE_WHATSAPP === 'true',
  ENABLE_VOICE_INPUT: process.env.ENABLE_VOICE_INPUT === 'true',
  ENABLE_AI_INSIGHTS: process.env.ENABLE_AI_INSIGHTS === 'true',
  ENABLE_GAMIFICATION: process.env.ENABLE_GAMIFICATION === 'true'
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return flags[feature] || false;
};

// Usage
if (isFeatureEnabled('ENABLE_WHATSAPP')) {
  await sendWhatsAppMessage({ to, message });
}
```

### 6.2 Frontend Feature Flags

```tsx
// web/src/contexts/FeatureFlagsContext.tsx
const FeatureFlagsContext = createContext<FeatureFlags | undefined>(undefined);

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags>({
    ENABLE_VOICE_INPUT: true,
    ENABLE_OFFLINE_MODE: true
  });

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const flags = useContext(FeatureFlagsContext);
  return flags?.[flag] || false;
};

// Usage
export default function NotesField() {
  const voiceInputEnabled = useFeatureFlag('ENABLE_VOICE_INPUT');

  return (
    <div>
      <textarea />
      {voiceInputEnabled && <VoiceInput />}
    </div>
  );
}
```

---

## 7. Accessibility (A11y)

### 7.1 Keyboard Navigation

```tsx
// Handle keyboard events
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
};

<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  className="cursor-pointer"
>
  Clickable Div
</div>
```

### 7.2 ARIA Labels

```tsx
// Icon-only buttons
<button aria-label="Close dialog" onClick={onClose}>
  <XMarkIcon className="w-6 h-6" />
</button>

// Form inputs
<label htmlFor="email" className="sr-only">Email</label>
<input
  id="email"
  type="email"
  aria-describedby="email-help"
  aria-required="true"
  aria-invalid={errors.email ? 'true' : 'false'}
/>
<span id="email-help" className="text-sm text-gray-500">
  We'll never share your email
</span>
{errors.email && (
  <span role="alert" className="text-sm text-red-600">
    {errors.email}
  </span>
)}
```

### 7.3 Focus Management

```tsx
// Trap focus in modal
import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black bg-opacity-50"
    >
      {children}
    </div>
  );
}
```

---

## 8. Analytics & Tracking

### 8.1 PostHog Setup

```typescript
// web/src/utils/analytics.ts
import posthog from 'posthog-js';

export const initAnalytics = () => {
  posthog.init(process.env.VITE_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.opt_out_capturing(); // Don't track in dev
      }
    }
  });
};

// Track events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

// Identify user
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  posthog.identify(userId, traits);
};

// Track page views
export const trackPageView = (pageName: string) => {
  posthog.capture('$pageview', { page: pageName });
};
```

### 8.2 Event Tracking Examples

```tsx
// Track button clicks
<button onClick={() => {
  trackEvent('contact_created', {
    contactType: formData.type,
    hasGPS: !!formData.latitude
  });
  handleSubmit();
}}>
  Create Contact
</button>

// Track form submissions
const handleLogin = async (email: string, password: string) => {
  try {
    await login(email, password);
    trackEvent('login_success');
  } catch (error) {
    trackEvent('login_failed', { error: error.message });
  }
};

// Track navigation
useEffect(() => {
  trackPageView(location.pathname);
}, [location]);
```

---

## 9. Search & Filtering

### 9.1 Debounced Search

```tsx
// web/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
export default function ContactsSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      fetchContacts({ search: debouncedSearch });
    }
  }, [debouncedSearch]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search contacts..."
    />
  );
}
```

---

## 10. File Upload

### 10.1 Image Compression Before Upload

```typescript
// web/src/utils/imageCompression.ts
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Max dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

---

## 11. Notifications

### 11.1 Toast Notifications

```tsx
// web/src/components/Toast.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  showToast: (message: string, type: ToastType) => void;
} | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36);
    const toast = { id, message, type };

    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-amber-500' :
              'bg-blue-500'
            } text-white`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
```

---

## 12. Maps & GPS

### 12.1 Leaflet Map Integration

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

```tsx
// web/src/components/MapView.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Contact {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  contacts: Contact[];
}

export default function MapView({ contacts }: MapViewProps) {
  const center = contacts[0]
    ? [contacts[0].latitude, contacts[0].longitude]
    : [28.6139, 77.2090]; // Default: Delhi

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={13}
      className="h-96 w-full rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {contacts.map(contact => (
        <Marker
          key={contact.id}
          position={[contact.latitude, contact.longitude]}
        >
          <Popup>{contact.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

---

**End of Feature Guidelines v1.0**

*For core development standards, see DEVELOPMENT_GUIDELINES.md*
*For operational procedures, see OPERATIONAL_GUIDELINES.md*
