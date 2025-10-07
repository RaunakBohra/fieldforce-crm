import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  X,
  Users,
  MapPin,
  Package,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  FileText,
  MapIcon,
  LogOut,
  MoreHorizontal
} from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Primary nav items (shown as icons only on desktop)
  const primaryNavItems = [
    { path: '/visits', label: 'Visits', icon: MapPin },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/contacts', label: 'Contacts', icon: Users },
  ];

  // All nav items for mobile
  const allNavItems = [
    { path: '/contacts', label: 'Contacts', icon: Users },
    { path: '/visits', label: 'Visits', icon: MapPin },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <nav className="bg-primary-800 text-white shadow-lg sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <button
              onClick={() => handleNavigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold hidden sm:block">Field Force CRM</h1>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-primary-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          <div className="hidden md:flex items-center gap-1">
            {/* Primary nav items - Icon + Text */}
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    active
                      ? 'bg-white text-primary-800 shadow-md'
                      : 'text-white hover:bg-primary-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive('/products') || isActive('/payments') || isActive('/analytics') || isActive('/reports') || isActive('/territories') || isActive('/users')
                    ? 'bg-white text-primary-800 shadow-md'
                    : 'text-white hover:bg-primary-700'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span>More</span>
              </button>
              {moreOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 text-neutral-900 z-50">
                  <button
                    onClick={() => { navigate('/products'); setMoreOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 flex items-center gap-3 ${
                      isActive('/products') ? 'bg-neutral-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Products
                  </button>
                  <button
                    onClick={() => { navigate('/payments'); setMoreOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 flex items-center gap-3 ${
                      isActive('/payments') ? 'bg-neutral-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Payments
                  </button>

                  <div className="my-1 border-t border-neutral-200"></div>

                  <button
                    onClick={() => { navigate('/analytics'); setMoreOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 flex items-center gap-3 ${
                      isActive('/analytics') ? 'bg-neutral-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Analytics
                  </button>
                  <button
                    onClick={() => { navigate('/reports'); setMoreOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 flex items-center gap-3 ${
                      isActive('/reports') ? 'bg-neutral-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Reports
                  </button>

                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <>
                      <div className="my-1 border-t border-neutral-200"></div>
                      <button
                        onClick={() => { navigate('/territories'); setMoreOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 flex items-center gap-3 ${
                          isActive('/territories') ? 'bg-neutral-50 text-primary-700 font-medium' : ''
                        }`}
                      >
                        <MapIcon className="w-4 h-4" />
                        Territories
                      </button>
                    </>
                  )}

                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => { navigate('/users'); setMoreOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 flex items-center gap-3 ${
                        isActive('/users') ? 'bg-neutral-50 text-primary-700 font-medium' : ''
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Users
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* User section */}
            <div className="ml-4 pl-4 border-l border-primary-700 flex items-center gap-3">
              <span className="text-sm text-primary-100 hidden lg:block">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-primary-700 hover:bg-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                aria-label="Logout from your account"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-700 animate-in slide-in-from-top duration-200">
            <div className="px-2 pt-4 pb-3">
              {/* Core Section */}
              <div className="mb-4">
                <h3 className="px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider mb-2">
                  Core
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {allNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-h-[80px] ${
                          active
                            ? 'bg-white text-primary-800 shadow-md'
                            : 'bg-primary-700/50 hover:bg-primary-700 text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reports Section */}
              <div className="mb-4">
                <h3 className="px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider mb-2">
                  Reports
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleNavigate('/analytics')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-h-[80px] ${
                      isActive('/analytics')
                        ? 'bg-white text-primary-800 shadow-md'
                        : 'bg-primary-700/50 hover:bg-primary-700 text-white'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Analytics</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/reports')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-h-[80px] ${
                      isActive('/reports')
                        ? 'bg-white text-primary-800 shadow-md'
                        : 'bg-primary-700/50 hover:bg-primary-700 text-white'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Reports</span>
                  </button>
                </div>
              </div>

              {/* Admin Section */}
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <div className="mb-4">
                  <h3 className="px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider mb-2">
                    Admin
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleNavigate('/territories')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-h-[80px] ${
                        isActive('/territories')
                          ? 'bg-white text-primary-800 shadow-md'
                          : 'bg-primary-700/50 hover:bg-primary-700 text-white'
                      }`}
                    >
                      <MapIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Territories</span>
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleNavigate('/users')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-h-[80px] ${
                          isActive('/users')
                            ? 'bg-white text-primary-800 shadow-md'
                            : 'bg-primary-700/50 hover:bg-primary-700 text-white'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-medium">Users</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* User Section */}
              <div className="pt-3 border-t border-primary-700">
                <div className="px-3 py-2 mb-2 text-sm text-primary-200">
                  {user?.name} · {user?.role}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full px-3 py-3 bg-primary-700 hover:bg-primary-600 rounded-lg transition-colors min-h-[44px] font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
