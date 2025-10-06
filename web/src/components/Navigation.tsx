import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
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
              <button
                onClick={() => navigate('/payments')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors"
              >
                Payments
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors"
              >
                Analytics
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
  );
}
