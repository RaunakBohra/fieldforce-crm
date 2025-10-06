import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { lazy, Suspense, type ReactElement } from 'react';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ThemePreview = lazy(() => import('./pages/ThemePreview'));
const ContactsList = lazy(() => import('./pages/ContactsList').then(m => ({ default: m.ContactsList })));
const ContactForm = lazy(() => import('./pages/ContactForm').then(m => ({ default: m.ContactForm })));
const VisitsList = lazy(() => import('./pages/VisitsList').then(m => ({ default: m.VisitsList })));
const VisitForm = lazy(() => import('./pages/VisitForm').then(m => ({ default: m.VisitForm })));
const VisitDetails = lazy(() => import('./pages/VisitDetails').then(m => ({ default: m.VisitDetails })));
const ProductsList = lazy(() => import('./pages/ProductsList').then(m => ({ default: m.ProductsList })));
const ProductForm = lazy(() => import('./pages/ProductForm').then(m => ({ default: m.ProductForm })));
const OrdersList = lazy(() => import('./pages/OrdersList').then(m => ({ default: m.OrdersList })));
const OrderForm = lazy(() => import('./pages/OrderForm').then(m => ({ default: m.OrderForm })));
const PaymentsList = lazy(() => import('./pages/PaymentsList'));
const PaymentForm = lazy(() => import('./pages/PaymentForm'));
const PendingPayments = lazy(() => import('./pages/PendingPayments'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const UsersList = lazy(() => import('./pages/UsersList').then(m => ({ default: m.UsersList })));
const UserForm = lazy(() => import('./pages/UserForm').then(m => ({ default: m.UserForm })));
const TerritoriesList = lazy(() => import('./pages/TerritoriesList').then(m => ({ default: m.TerritoriesList })));
const TerritoryForm = lazy(() => import('./pages/TerritoryForm').then(m => ({ default: m.TerritoryForm })));
const ThemeComparison = lazy(() => import('./pages/ThemeComparison').then(m => ({ default: m.ThemeComparison })));

function PrivateRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/themes" element={<ThemePreview />} />
            <Route path="/theme-comparison" element={<ThemeComparison />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <PrivateRoute>
                  <ContactsList />
                </PrivateRoute>
              }
            />
            <Route
              path="/contacts/new"
              element={
                <PrivateRoute>
                  <ContactForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/contacts/:id/edit"
              element={
                <PrivateRoute>
                  <ContactForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/visits"
              element={
                <PrivateRoute>
                  <VisitsList />
                </PrivateRoute>
              }
            />
            <Route
              path="/visits/new"
              element={
                <PrivateRoute>
                  <VisitForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/visits/:id"
              element={
                <PrivateRoute>
                  <VisitDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/visits/:id/edit"
              element={
                <PrivateRoute>
                  <VisitForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/products"
              element={
                <PrivateRoute>
                  <ProductsList />
                </PrivateRoute>
              }
            />
            <Route
              path="/products/new"
              element={
                <PrivateRoute>
                  <ProductForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <OrdersList />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/new"
              element={
                <PrivateRoute>
                  <OrderForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <PaymentsList />
                </PrivateRoute>
              }
            />
            <Route
              path="/payments/new"
              element={
                <PrivateRoute>
                  <PaymentForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/payments/new/:orderId"
              element={
                <PrivateRoute>
                  <PaymentForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/payments/pending"
              element={
                <PrivateRoute>
                  <PendingPayments />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <Analytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <UsersList />
                </PrivateRoute>
              }
            />
            <Route
              path="/users/new"
              element={
                <PrivateRoute>
                  <UserForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/users/:id/edit"
              element={
                <PrivateRoute>
                  <UserForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/territories"
              element={
                <PrivateRoute>
                  <TerritoriesList />
                </PrivateRoute>
              }
            />
            <Route
              path="/territories/new"
              element={
                <PrivateRoute>
                  <TerritoryForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/territories/:id/edit"
              element={
                <PrivateRoute>
                  <TerritoryForm />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
