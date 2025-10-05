import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-teal-50">
      <nav className="bg-teal-800 text-white shadow-lg" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Field Force CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm" aria-label="Current user">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-teal-700 hover:bg-teal-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
            <h2 id="user-profile" className="text-2xl font-bold text-slate-900 mb-4">
              Welcome, {user?.name}!
            </h2>
            <div className="space-y-2 text-slate-600">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
              <p><strong>Role:</strong> {user?.role}</p>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Statistics overview">
            <div className="bg-white rounded-lg shadow p-6" role="article">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Contacts</h3>
              <p className="text-3xl font-bold text-teal-600" aria-label="Contact count">0</p>
              <p className="text-sm text-slate-500 mt-1">Coming in Day 2</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6" role="article">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Visits</h3>
              <p className="text-3xl font-bold text-teal-600" aria-label="Visit count">0</p>
              <p className="text-sm text-slate-500 mt-1">Coming in Day 3</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6" role="article">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Orders</h3>
              <p className="text-3xl font-bold text-teal-600" aria-label="Order count">0</p>
              <p className="text-sm text-slate-500 mt-1">Coming in Day 4</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
