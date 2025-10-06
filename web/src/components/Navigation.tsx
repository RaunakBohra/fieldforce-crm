import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-primary-800 text-white shadow-lg" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center justify-between w-full md:w-auto">
            <h1 className="text-xl font-bold">Field Force CRM</h1>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-primary-700 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-2 lg:space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/contacts')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
              >
                Contacts
              </button>
              <button
                onClick={() => navigate('/visits')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
              >
                Visits
              </button>
              <button
                onClick={() => navigate('/products')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
              >
                Products
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
              >
                Orders
              </button>
              <button
                onClick={() => navigate('/payments')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
              >
                Payments
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
              >
                Analytics
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
              >
                Reports
              </button>
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <>
                  <button
                    onClick={() => navigate('/territories')}
                    className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
                  >
                    Territories
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => navigate('/users')}
                      className="hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
                    >
                      Users
                    </button>
                  )}
                </>
              )}
            </nav>
            <div className="flex items-center space-x-4">
              <span className="text-sm hidden lg:block" aria-label="Current user">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-primary-700 hover:bg-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px]"
                aria-label="Logout from your account"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => handleNavigate('/dashboard')}
                className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigate('/contacts')}
                className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Contacts
              </button>
              <button
                onClick={() => handleNavigate('/visits')}
                className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Visits
              </button>
              <button
                onClick={() => handleNavigate('/products')}
                className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Products
              </button>
              <button
                onClick={() => handleNavigate('/orders')}
                className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Orders
              </button>
              <button
                onClick={() => handleNavigate('/payments')}
                className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Payments
              </button>
              <button
                onClick={() => handleNavigate('/analytics')}
                className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Analytics
              </button>
              <button
                onClick={() => handleNavigate('/reports')}
                className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
              >
                Reports
              </button>
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <>
                  <button
                    onClick={() => handleNavigate('/territories')}
                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
                  >
                    Territories
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleNavigate('/users')}
                      className="block w-full text-left px-3 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
                    >
                      Users
                    </button>
                  )}
                </>
              )}
              <div className="pt-2 border-t border-primary-700">
                <div className="px-3 py-2 text-sm text-primary-200">
                  {user?.name}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-3 bg-primary-700 hover:bg-primary-600 rounded-lg transition-colors min-h-[44px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
