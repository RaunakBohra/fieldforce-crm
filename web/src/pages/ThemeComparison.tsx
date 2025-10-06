import { useState } from 'react';
import { Package, Users, MapPin, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

type Theme = {
  name: string;
  description: string;
  primary: {
    main: string;
    dark: string;
    light: string;
    text: string;
  };
  accent: {
    main: string;
    light: string;
  };
};

const themes: Theme[] = [
  {
    name: 'Current (Indigo/Pink)',
    description: 'Current blue-purple theme',
    primary: {
      main: '#3730a3',
      dark: '#1e3a8a',
      light: '#eef2ff',
      text: '#ffffff',
    },
    accent: {
      main: '#db2777',
      light: '#fce7f3',
    },
  },
  {
    name: 'Medical Trust (Teal/Coral)',
    description: 'Professional, trustworthy, medical',
    primary: {
      main: '#0d9488',
      dark: '#115e59',
      light: '#f0fdfa',
      text: '#ffffff',
    },
    accent: {
      main: '#f59e0b',
      light: '#fef3c7',
    },
  },
  {
    name: 'Modern Professional (Slate/Cyan)',
    description: 'Sophisticated, neutral, modern',
    primary: {
      main: '#475569',
      dark: '#1e293b',
      light: '#f8fafc',
      text: '#ffffff',
    },
    accent: {
      main: '#06b6d4',
      light: '#cffafe',
    },
  },
  {
    name: 'Classic Corporate (Navy/Orange)',
    description: 'Traditional, trustworthy, serious',
    primary: {
      main: '#1e40af',
      dark: '#1e3a8a',
      light: '#eff6ff',
      text: '#ffffff',
    },
    accent: {
      main: '#f97316',
      light: '#ffedd5',
    },
  },
  {
    name: 'Clean Minimal (Charcoal/Emerald)',
    description: 'Neutral, clean, modern SaaS',
    primary: {
      main: '#374151',
      dark: '#1f2937',
      light: '#f9fafb',
      text: '#ffffff',
    },
    accent: {
      main: '#10b981',
      light: '#d1fae5',
    },
  },
];

export function ThemeComparison() {
  const [selectedTheme, setSelectedTheme] = useState(0);
  const theme = themes[selectedTheme];

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Theme Comparison</h1>
        <p className="text-neutral-600 mb-6">Select a theme to preview how your app would look</p>

        {/* Theme Selector */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {themes.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTheme(idx)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTheme === idx
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: t.primary.main }}
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: t.accent.main }}
                />
              </div>
              <h3 className="font-semibold text-sm text-neutral-900 mb-1">{t.name}</h3>
              <p className="text-xs text-neutral-600">{t.description}</p>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="space-y-6">
          {/* Header Preview */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <h2 className="text-xl font-bold text-neutral-900 p-4 border-b">Header & Navigation</h2>
            <div>
              {/* Desktop Header */}
              <div
                className="p-4"
                style={{ backgroundColor: theme.primary.dark }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <Package className="w-6 h-6" style={{ color: theme.primary.text }} />
                      <span className="font-bold text-lg" style={{ color: theme.primary.text }}>
                        FieldForce
                      </span>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <button
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: theme.primary.main,
                          color: theme.primary.text
                        }}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Visits</span>
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                        style={{ color: theme.primary.text }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Orders</span>
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                        style={{ color: theme.primary.text }}
                      >
                        <Users className="w-4 h-4" />
                        <span>Contacts</span>
                      </button>
                    </div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                    style={{ backgroundColor: theme.accent.main, color: '#ffffff' }}
                  >
                    JD
                  </div>
                </div>
              </div>

              {/* Mobile Menu */}
              <div className="p-4 bg-white border-t">
                <p className="text-sm font-medium text-neutral-700 mb-3">Mobile Menu:</p>
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: theme.primary.dark }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: MapPin, label: 'Visits' },
                      { icon: ShoppingCart, label: 'Orders' },
                      { icon: Users, label: 'Contacts' },
                      { icon: Package, label: 'Products' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg min-h-[80px] transition-colors"
                        style={{
                          backgroundColor: idx === 0 ? theme.primary.main : 'transparent',
                          color: theme.primary.text
                        }}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard KPI Cards */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Dashboard KPI Cards</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.primary.light,
                  borderColor: theme.primary.main + '40'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: theme.primary.dark }}>
                      Today's Visits
                    </p>
                    <p className="text-2xl font-bold" style={{ color: theme.primary.main }}>
                      12
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.primary.main }}>
                      48 this week
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 opacity-50" style={{ color: theme.primary.main }} />
                </div>
              </div>

              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: theme.accent.light,
                  borderColor: theme.accent.main + '40'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: theme.accent.main }}>
                      Pending Orders
                    </p>
                    <p className="text-2xl font-bold" style={{ color: theme.accent.main }}>
                      8
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.accent.main }}>
                      ₹2.4L value
                    </p>
                  </div>
                  <ShoppingCart className="w-8 h-8 opacity-50" style={{ color: theme.accent.main }} />
                </div>
              </div>

              <div className="p-4 rounded-lg border border-success-200 bg-success-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-success-700 mb-1">Collected</p>
                    <p className="text-2xl font-bold text-success-600">₹1.8L</p>
                    <p className="text-xs text-success-600 mt-1">This month</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success-600 opacity-50" />
                </div>
              </div>

              <div className="p-4 rounded-lg border border-warn-200 bg-warn-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-warn-700 mb-1">Outstanding</p>
                    <p className="text-2xl font-bold text-warn-600">₹3.2L</p>
                    <p className="text-xs text-warn-600 mt-1">Due payments</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-warn-600 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Buttons & Actions</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  className="px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: theme.primary.main,
                    color: theme.primary.text
                  }}
                >
                  <Package className="w-4 h-4" />
                  Primary Button
                </button>
                <button
                  className="px-6 py-2.5 rounded-lg border-2 font-medium transition-all"
                  style={{
                    borderColor: theme.primary.main,
                    color: theme.primary.main,
                    backgroundColor: 'transparent'
                  }}
                >
                  Secondary Button
                </button>
                <button
                  className="px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: theme.accent.main,
                    color: '#ffffff'
                  }}
                >
                  Badge/Pill
                </button>
              </div>
            </div>
          </div>

          {/* Form Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Form Elements</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Input Field
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-current"
                  style={{ borderColor: theme.primary.main }}
                  placeholder="Enter text..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Select Field
                </label>
                <select
                  className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: theme.primary.main }}
                >
                  <option>Choose option...</option>
                </select>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Color Palette</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Primary Colors</p>
                <div className="flex gap-2">
                  <div className="flex-1 text-center">
                    <div
                      className="h-16 rounded-lg mb-1"
                      style={{ backgroundColor: theme.primary.dark }}
                    />
                    <p className="text-xs text-neutral-600">Dark</p>
                    <p className="text-xs font-mono">{theme.primary.dark}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <div
                      className="h-16 rounded-lg mb-1"
                      style={{ backgroundColor: theme.primary.main }}
                    />
                    <p className="text-xs text-neutral-600">Main</p>
                    <p className="text-xs font-mono">{theme.primary.main}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <div
                      className="h-16 rounded-lg mb-1 border border-neutral-200"
                      style={{ backgroundColor: theme.primary.light }}
                    />
                    <p className="text-xs text-neutral-600">Light</p>
                    <p className="text-xs font-mono">{theme.primary.light}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Accent Colors</p>
                <div className="flex gap-2">
                  <div className="flex-1 text-center">
                    <div
                      className="h-16 rounded-lg mb-1"
                      style={{ backgroundColor: theme.accent.main }}
                    />
                    <p className="text-xs text-neutral-600">Main</p>
                    <p className="text-xs font-mono">{theme.accent.main}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <div
                      className="h-16 rounded-lg mb-1 border border-neutral-200"
                      style={{ backgroundColor: theme.accent.light }}
                    />
                    <p className="text-xs text-neutral-600">Light</p>
                    <p className="text-xs font-mono">{theme.accent.light}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
