import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  MapPin,
  Package,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  FileText,
  MapIcon,
  LogOut,
  ChevronDown
} from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

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

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    active
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-primary-700 text-primary-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Reports Dropdown */}
            <div className="relative">
              <button
                onClick={() => setReportsOpen(!reportsOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive('/analytics') || isActive('/reports')
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-primary-700 text-primary-50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Reports</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
              </button>
              {reportsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 text-neutral-900">
                  <button
                    onClick={() => { navigate('/analytics'); setReportsOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2 ${
                      isActive('/analytics') ? 'bg-neutral-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Analytics
                  </button>
                  <button
                    onClick={() => { navigate('/reports'); setReportsOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2 ${
                      isActive('/reports') ? 'bg-neutral-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Reports
                  </button>
                </div>
              )}
            </div>

            {/* Admin sections */}
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button
                onClick={() => navigate('/territories')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive('/territories')
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-primary-700 text-primary-50'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Territories</span>
              </button>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/users')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive('/users')
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-primary-700 text-primary-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Users</span>
              </button>
            )}

            {/* User section */}
            <div className="ml-4 pl-4 border-l border-primary-700 flex items-center gap-3">
              <span className="text-sm text-primary-100 hidden lg:block">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-primary-700 hover:bg-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-h-[80px] ${
                          active
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-700/50 hover:bg-primary-700 text-primary-50'
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
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-700/50 hover:bg-primary-700 text-primary-50'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Analytics</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/reports')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-h-[80px] ${
                      isActive('/reports')
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-700/50 hover:bg-primary-700 text-primary-50'
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
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-700/50 hover:bg-primary-700 text-primary-50'
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
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-700/50 hover:bg-primary-700 text-primary-50'
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
