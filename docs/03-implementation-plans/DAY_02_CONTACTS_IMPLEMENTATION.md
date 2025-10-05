# Day 2: Contacts Module (CRUD)

**Goal**: Complete contacts management with CRUD operations, GPS coordinates, and assignment to sales reps

**Duration**: 8 hours (9:00 AM - 5:30 PM)

---

## 9:00 AM - 9:45 AM: Contacts Database Schema

### Tasks:
- [ ] Create Prisma schema for contacts table
- [ ] Add indexes for performance
- [ ] Run migration to create table

### Commands:
```bash
cd api

# Update schema.prisma - add Contact model
# (Already exists in main schema.prisma)

# Create and run migration
npx prisma migrate dev --name add_contacts_table

# Verify migration
npx prisma studio
```

### Expected Output:
```
✔ Generated Prisma Client
✔ Applied migration: add_contacts_table
```

### Success Criteria:
- [ ] `contacts` table created in PostgreSQL
- [ ] Columns: id, type, name, phone, email, latitude, longitude, assignedTo, customField1, customField2, createdAt
- [ ] Indexes on: email, assignedTo, type

---

## 9:45 AM - 11:00 AM: Backend Contacts API

### Tasks:
- [ ] Create contacts controller
- [ ] Create contacts routes
- [ ] Implement CRUD operations (Create, Read, Update, Delete)
- [ ] Add validation middleware

### Files to Create:

**api/src/controllers/contacts.ts**:
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /contacts - List all contacts with filters
export const getContacts = async (req: Request, res: Response) => {
  try {
    const { type, assignedTo, search } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

// GET /contacts/:id - Get single contact
export const getContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

// POST /contacts - Create contact
export const createContact = async (req: Request, res: Response) => {
  try {
    const { type, name, phone, email, address, latitude, longitude, assignedTo, customField1, customField2 } = req.body;

    // Validation
    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required' });
    }

    if (!['doctor', 'retailer', 'wholesaler', 'dealer', 'other'].includes(type)) {
      return res.status(400).json({ error: 'Invalid contact type' });
    }

    const contact = await prisma.contact.create({
      data: {
        type,
        name,
        phone,
        email,
        address,
        latitude,
        longitude,
        assignedTo,
        customField1,
        customField2
      }
    });

    res.status(201).json({ contact });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

// PUT /contacts/:id - Update contact
export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, name, phone, email, address, latitude, longitude, assignedTo, customField1, customField2 } = req.body;

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        type,
        name,
        phone,
        email,
        address,
        latitude,
        longitude,
        assignedTo,
        customField1,
        customField2
      }
    });

    res.json({ contact });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

// DELETE /contacts/:id - Delete contact
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.contact.delete({
      where: { id }
    });

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};
```

**api/src/routes/contacts.ts**:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
} from '../controllers/contacts';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
```

**api/src/middleware/auth.ts** (Create if not exists):
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

### Update server.ts:
```typescript
// Add to api/src/server.ts
import contactsRoutes from './routes/contacts';

app.use('/contacts', contactsRoutes);
```

### Test Commands:
```bash
# Start server
npm run dev

# In another terminal, test endpoints:
curl -X POST http://localhost:5000/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"doctor","name":"Dr. Sharma","phone":"9876543210","email":"sharma@example.com"}'

curl http://localhost:5000/contacts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Success Criteria:
- [ ] All CRUD endpoints working
- [ ] Authentication middleware protecting routes
- [ ] Validation preventing invalid data
- [ ] Search and filter working

---

## 11:00 AM - 12:00 PM: Frontend Contacts List Page

### Files to Create:

**web/src/pages/Contacts.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Contact {
  id: string;
  type: string;
  name: string;
  phone?: string;
  email?: string;
  assignedTo?: string;
  createdAt: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts();
  }, [search, typeFilter]);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`http://localhost:5000/contacts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setContacts(data.contacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await fetch(`http://localhost:5000/contacts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      fetchContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <button
            onClick={() => navigate('/contacts/new')}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            + Add Contact
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Types</option>
              <option value="doctor">Doctor</option>
              <option value="retailer">Retailer</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="dealer">Dealer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
                      {contact.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                      className="text-teal-600 hover:text-teal-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {contacts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No contacts found. Click "Add Contact" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Success Criteria:
- [ ] Contacts list displays all contacts
- [ ] Search filters by name/phone/email
- [ ] Type filter works correctly
- [ ] Delete confirmation works
- [ ] Responsive design

---

## 1:00 PM - 2:30 PM: Frontend Contact Form (Create/Edit)

### Files to Create:

**web/src/pages/ContactForm.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ContactForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    type: 'doctor',
    name: '',
    phone: '',
    email: '',
    address: '',
    latitude: '',
    longitude: '',
    assignedTo: '',
    customField1: '',
    customField2: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchContact();
    }
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await fetch(`http://localhost:5000/contacts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setFormData(data.contact);
    } catch (error) {
      console.error('Failed to fetch contact:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEditMode
        ? `http://localhost:5000/contacts/${id}`
        : 'http://localhost:5000/contacts';

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save contact');
      }

      navigate('/contacts');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          alert('Failed to get location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {isEditMode ? 'Edit Contact' : 'Add New Contact'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="doctor">Doctor</option>
                <option value="retailer">Retailer</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="dealer">Dealer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Get GPS
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Contact' : 'Create Contact'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/contacts')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Success Criteria:
- [ ] Form creates new contacts
- [ ] Form edits existing contacts
- [ ] GPS location button works
- [ ] Validation prevents empty required fields
- [ ] Cancel button navigates back

---

## 2:30 PM - 3:30 PM: Add Routing and Navigation

### Update App.tsx:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Contacts from './pages/Contacts';
import ContactForm from './pages/ContactForm';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/new" element={<ContactForm />} />
          <Route path="/contacts/:id" element={<ContactForm />} />
          <Route path="/" element={<Navigate to="/contacts" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Commands:
```bash
cd web
npm run dev
```

### Manual Testing:
1. [ ] Login with test credentials
2. [ ] Navigate to /contacts
3. [ ] Click "Add Contact"
4. [ ] Fill form and submit
5. [ ] Verify contact appears in list
6. [ ] Click "Edit" on contact
7. [ ] Update contact and save
8. [ ] Click "Delete" and confirm
9. [ ] Test search functionality
10. [ ] Test type filter

---

## 3:30 PM - 4:30 PM: Add Simple Dashboard Layout

### Files to Create:

**web/src/components/Layout.tsx**:
```typescript
import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold">
                Field Force CRM
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link to="/contacts" className="hover:bg-teal-700 px-3 py-2 rounded">
                  Contacts
                </Link>
                <Link to="/visits" className="hover:bg-teal-700 px-3 py-2 rounded">
                  Visits
                </Link>
                <Link to="/orders" className="hover:bg-teal-700 px-3 py-2 rounded">
                  Orders
                </Link>
                <Link to="/payments" className="hover:bg-teal-700 px-3 py-2 rounded">
                  Payments
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

### Update pages to use Layout:
```typescript
// Update Contacts.tsx and ContactForm.tsx
import Layout from '../components/Layout';

export default function Contacts() {
  return (
    <Layout>
      {/* existing content */}
    </Layout>
  );
}
```

### Success Criteria:
- [ ] Navigation bar appears on all pages
- [ ] User name displayed
- [ ] Logout button works
- [ ] Links navigate correctly

---

## 4:30 PM - 5:00 PM: Git Commit and Documentation

### Commands:
```bash
git add .
git commit -m "Day 2: Implement contacts CRUD module

- Add contacts table with Prisma schema
- Create backend API endpoints (CRUD)
- Add authentication middleware
- Build contacts list page with search/filter
- Create contact form (create/edit)
- Add GPS location capture
- Implement navigation layout
- Add routing for contacts pages

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### Update README.md:
```markdown
## Day 2 Progress ✓

- [x] Contacts database schema
- [x] Backend CRUD API for contacts
- [x] Frontend contacts list with search/filter
- [x] Contact create/edit form
- [x] GPS location capture
- [x] Navigation layout
```

---

## 5:00 PM - 5:30 PM: Day 2 Review & Day 3 Planning

### Review Checklist:
- [ ] All contacts CRUD operations working
- [ ] Search and filter functional
- [ ] GPS location capture working
- [ ] Navigation between pages smooth
- [ ] No console errors
- [ ] Code committed and pushed

### Day 3 Preview:
Tomorrow we will implement:
- Visit tracking module
- GPS check-in/check-out
- Photo upload for visit verification
- Visit history and timeline
- Distance calculation from contact location

### Success Metrics:
- **Lines of Code**: ~800 lines
- **Files Created**: 6 new files
- **API Endpoints**: 5 endpoints
- **Features Complete**: Contacts CRUD ✓

---

## End of Day 2

**Total Time**: 8 hours
**Status**: Contacts module complete with full CRUD operations
**Next**: Day 3 - Visit Tracking Module
