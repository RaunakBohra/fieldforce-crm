import { useState } from 'react';
import { Link } from 'react-router-dom';

const themes = [
  {
    id: 1,
    name: 'Modern Minimal',
    description: 'Trust + Clarity - Clean SaaS look like Notion, ClickUp',
    colors: {
      primary: '#3B82F6',
      accent: '#6366F1',
      bg: '#FFFFFF',
      surface: '#F9FAFB',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  {
    id: 2,
    name: 'Brand Warm',
    description: 'iWishBag Identity - Professional with warmth and trust',
    colors: {
      primary: '#F97316',
      accent: '#1E293B',
      bg: '#FFFFFF',
      surface: '#F8FAFC',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      success: '#16A34A',
      warning: '#FACC15',
      error: '#DC2626',
    },
  },
  {
    id: 3,
    name: 'Elegant Green',
    description: 'Growth + Reliability - Inspired by Zoho, HubSpot CRM',
    colors: {
      primary: '#059669',
      accent: '#334155',
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      success: '#22C55E',
      warning: '#EAB308',
      error: '#DC2626',
    },
  },
  {
    id: 4,
    name: 'Dark Mode Pro',
    description: 'Power + Focus - For power users and admin dashboards',
    colors: {
      primary: '#3B82F6',
      accent: '#8B5CF6',
      bg: '#0F172A',
      surface: '#1E293B',
      textPrimary: '#F1F5F9',
      textSecondary: '#94A3B8',
      success: '#22C55E',
      warning: '#FACC15',
      error: '#EF4444',
    },
  },
  {
    id: 5,
    name: 'Neutral Corporate',
    description: 'Global Enterprise - Like Salesforce, Oracle, SAP',
    colors: {
      primary: '#2563EB',
      accent: '#0EA5E9',
      bg: '#F3F4F6',
      surface: '#FFFFFF',
      textPrimary: '#111827',
      textSecondary: '#64748B',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  {
    id: 6,
    name: 'Fresh Gradient',
    description: 'Modern WebApp - Young, creative, visually stunning',
    colors: {
      primary: '#6366F1',
      accent: '#EC4899',
      bg: '#F9FAFB',
      surface: '#FFFFFF',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      gradient: 'linear-gradient(135deg, #6366F1, #EC4899)',
    },
  },
];

export default function ThemePreview() {
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);

  const theme = selectedTheme.colors;
  const isDark = selectedTheme.id === 4;

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh' }}>
      {/* Theme Selector */}
      <div style={{
        backgroundColor: theme.surface,
        borderBottom: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: theme.textPrimary,
              margin: 0,
            }}>
              iWishBag CRM - Theme Preview
            </h1>
            <Link
              to="/login"
              style={{
                color: theme.primary,
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              ← Back to Login
            </Link>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
          }}>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTheme(t)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: selectedTheme.id === t.id ? `2px solid ${theme.primary}` : '2px solid transparent',
                  backgroundColor: selectedTheme.id === t.id ? theme.primary : theme.surface,
                  color: selectedTheme.id === t.id ? '#FFFFFF' : theme.textPrimary,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Theme Info */}
        <div style={{
          backgroundColor: theme.surface,
          padding: '1.5rem',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
          border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
        }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: theme.textPrimary,
            marginBottom: '0.5rem',
          }}>
            {selectedTheme.name}
          </h2>
          <p style={{ color: theme.textSecondary, marginBottom: '1.5rem' }}>
            {selectedTheme.description}
          </p>

          {/* Color Palette */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{
                width: '100%',
                height: '60px',
                backgroundColor: theme.primary,
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
              }} />
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0 }}>Primary</p>
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0, fontFamily: 'monospace' }}>
                {theme.primary}
              </p>
            </div>
            <div>
              <div style={{
                width: '100%',
                height: '60px',
                backgroundColor: theme.accent,
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
              }} />
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0 }}>Accent</p>
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0, fontFamily: 'monospace' }}>
                {theme.accent}
              </p>
            </div>
            <div>
              <div style={{
                width: '100%',
                height: '60px',
                backgroundColor: theme.success,
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
              }} />
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0 }}>Success</p>
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0, fontFamily: 'monospace' }}>
                {theme.success}
              </p>
            </div>
            <div>
              <div style={{
                width: '100%',
                height: '60px',
                backgroundColor: theme.warning,
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
              }} />
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0 }}>Warning</p>
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0, fontFamily: 'monospace' }}>
                {theme.warning}
              </p>
            </div>
            <div>
              <div style={{
                width: '100%',
                height: '60px',
                backgroundColor: theme.error,
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
              }} />
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0 }}>Error</p>
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, margin: 0, fontFamily: 'monospace' }}>
                {theme.error}
              </p>
            </div>
          </div>
        </div>

        {/* Sample Dashboard Components */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Stat Card 1 */}
          <div style={{
            backgroundColor: theme.surface,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: theme.textSecondary,
              margin: '0 0 0.5rem 0',
            }}>
              Total Quotes
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: theme.primary,
              margin: '0 0 0.5rem 0',
            }}>
              1,247
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: theme.success,
              margin: 0,
            }}>
              ↑ 12.5% from last month
            </p>
          </div>

          {/* Stat Card 2 */}
          <div style={{
            backgroundColor: theme.surface,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: theme.textSecondary,
              margin: '0 0 0.5rem 0',
            }}>
              Active Orders
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: theme.accent,
              margin: '0 0 0.5rem 0',
            }}>
              342
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: theme.textSecondary,
              margin: 0,
            }}>
              Processing shipments
            </p>
          </div>

          {/* Stat Card 3 */}
          <div style={{
            backgroundColor: theme.surface,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: theme.textSecondary,
              margin: '0 0 0.5rem 0',
            }}>
              Revenue (MTD)
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: theme.success,
              margin: '0 0 0.5rem 0',
            }}>
              $45.2K
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: theme.success,
              margin: 0,
            }}>
              ↑ 8.3% from last month
            </p>
          </div>
        </div>

        {/* Buttons Showcase */}
        <div style={{
          backgroundColor: theme.surface,
          padding: '1.5rem',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
          border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: theme.textPrimary,
            marginBottom: '1rem',
          }}>
            Buttons & Actions
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button style={{
              background: selectedTheme.id === 6 ? theme.gradient : theme.primary,
              color: '#FFFFFF',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Primary Action
            </button>
            <button style={{
              backgroundColor: theme.accent,
              color: '#FFFFFF',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Secondary Action
            </button>
            <button style={{
              backgroundColor: theme.success,
              color: '#FFFFFF',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Approve
            </button>
            <button style={{
              backgroundColor: theme.error,
              color: '#FFFFFF',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Reject
            </button>
          </div>
        </div>

        {/* Sample Table */}
        <div style={{
          backgroundColor: theme.surface,
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: theme.textPrimary,
            marginBottom: '1rem',
          }}>
            Recent Quotes
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#E5E7EB'}` }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: theme.textSecondary, fontWeight: 600, fontSize: '0.875rem' }}>
                    Quote ID
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: theme.textSecondary, fontWeight: 600, fontSize: '0.875rem' }}>
                    Customer
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: theme.textSecondary, fontWeight: 600, fontSize: '0.875rem' }}>
                    Amount
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: theme.textSecondary, fontWeight: 600, fontSize: '0.875rem' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'QT-2024-001', customer: 'Acme Corp', amount: '$12,450', status: 'approved', color: theme.success },
                  { id: 'QT-2024-002', customer: 'Global Trading', amount: '$8,230', status: 'pending', color: theme.warning },
                  { id: 'QT-2024-003', customer: 'Import Solutions', amount: '$15,890', status: 'approved', color: theme.success },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#E5E7EB'}` }}>
                    <td style={{ padding: '0.75rem', color: theme.textPrimary, fontSize: '0.875rem' }}>{row.id}</td>
                    <td style={{ padding: '0.75rem', color: theme.textPrimary, fontSize: '0.875rem' }}>{row.customer}</td>
                    <td style={{ padding: '0.75rem', color: theme.textPrimary, fontSize: '0.875rem', fontWeight: 600 }}>{row.amount}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: `${row.color}20`,
                        color: row.color,
                      }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
