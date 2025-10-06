import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { ContactStats, VisitStats } from '../services/api';
import { Users, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    fetchContactStats();
    fetchVisitStats();
  }, []);

  const fetchContactStats = async () => {
    try {
      const response = await api.getContactStats();
      if (response.success && response.data) {
        setContactStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch contact stats:', error);
    }
  };

  const fetchVisitStats = async () => {
    try {
      const response = await api.getVisitStats();
      if (response.success && response.data) {
        setVisitStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch visit stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <nav className="bg-primary-800 text-white shadow-lg" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">Field Force CRM</h1>
              <nav className="hidden md:flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/contacts')}
                  className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors"
                >
                  Contacts
                </button>
                <button
                  onClick={() => navigate('/visits')}
                  className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors"
                >
                  Visits
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors"
                >
                  Products
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors"
                >
                  Orders
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm" aria-label="Current user">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-primary-700 hover:bg-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                aria-label="Logout from your account"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" role="main">
        <div className="px-4 py-6 sm:px-0">
          <section className="bg-white rounded-lg shadow p-6" aria-labelledby="user-profile">
            <h2 id="user-profile" className="text-2xl font-bold text-neutral-900 mb-4">
              Welcome, {user?.name}!
            </h2>
            <div className="space-y-2 text-accent-500">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
              <p><strong>Role:</strong> {user?.role}</p>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Statistics overview">
            <button
              onClick={() => navigate('/contacts')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
              role="article"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-neutral-900">Contacts</h3>
                <Users className="w-6 h-6 text-primary-800" />
              </div>
              <p className="text-3xl font-bold text-primary-600" aria-label="Contact count">
                {contactStats?.total ?? 0}
              </p>
              {contactStats && (
                <div className="mt-2 text-sm text-accent-500">
                  <span>{contactStats.distribution} Distribution</span>
                  <span className="mx-2">•</span>
                  <span>{contactStats.medical} Medical</span>
                </div>
              )}
            </button>

            <button
              onClick={() => navigate('/visits')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
              role="article"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-neutral-900">Visits</h3>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600" aria-label="Visit count">
                {visitStats?.completedVisits ?? 0}
              </p>
              {visitStats && (
                <div className="mt-2 text-sm text-accent-500">
                  <span>{visitStats.plannedVisits} Planned</span>
                  <span className="mx-2">•</span>
                  <span>{visitStats.monthVisits} This Month</span>
                </div>
              )}
            </button>

            <div className="bg-white rounded-lg shadow p-6" role="article">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-neutral-900">Orders</h3>
                <CheckCircle2 className="w-6 h-6 text-primary-800" />
              </div>
              <p className="text-3xl font-bold text-primary-600" aria-label="Order count">0</p>
              <p className="text-sm text-accent-500 mt-1">Coming in Day 4</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
