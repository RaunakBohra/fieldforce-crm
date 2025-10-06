# Day 3: Visit Tracking Module

**Goal**: Implement GPS-based visit tracking with check-in/check-out, photo verification, and visit history

**Duration**: 8 hours (9:00 AM - 5:30 PM)

---

## 9:00 AM - 10:00 AM: Visits Database Schema & Backend Setup

### Tasks:
- [ ] Create Prisma schema for visits table
- [ ] Add indexes for performance
- [ ] Run migration
- [ ] Create visits controller

### Commands:
```bash
cd api

# Update schema.prisma - add Visit model
npx prisma migrate dev --name add_visits_table

# Verify
npx prisma studio
```

### Files to Create:

**api/src/controllers/visits.ts**:
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// POST /visits/check-in - Check in to a visit
export const checkIn = async (req: Request, res: Response) => {
  try {
    const { contactId, latitude, longitude, photoUrl, notes } = req.body;
    const userId = (req as any).user.userId;

    // Validation
    if (!contactId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Contact ID and GPS coordinates are required' });
    }

    // Get contact location
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if contact has GPS coordinates
    let isVerified = false;
    let distanceFromContact = null;

    if (contact.latitude && contact.longitude) {
      distanceFromContact = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(contact.latitude.toString()),
        parseFloat(contact.longitude.toString())
      );

      // Verify if within 100 meters
      isVerified = distanceFromContact <= 100;
    }

    const visit = await prisma.visit.create({
      data: {
        contactId,
        userId,
        checkInAt: new Date(),
        checkInLat: latitude,
        checkInLng: longitude,
        checkInPhotoUrl: photoUrl,
        notes,
        isVerified,
        distanceFromContact: distanceFromContact
      }
    });

    res.status(201).json({
      visit,
      message: isVerified
        ? 'Check-in verified - within 100m of contact location'
        : 'Check-in recorded - location not verified'
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
};

// PUT /visits/:id/check-out - Check out from a visit
export const checkOut = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, photoUrl, notes } = req.body;

    const visit = await prisma.visit.update({
      where: { id },
      data: {
        checkOutAt: new Date(),
        checkOutLat: latitude,
        checkOutLng: longitude,
        checkOutPhotoUrl: photoUrl,
        checkOutNotes: notes
      }
    });

    // Calculate visit duration
    const duration = Math.floor(
      (visit.checkOutAt.getTime() - visit.checkInAt.getTime()) / 1000 / 60
    );

    res.json({
      visit,
      duration: `${duration} minutes`
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Failed to check out' });
  }
};

// GET /visits - List all visits with filters
export const getVisits = async (req: Request, res: Response) => {
  try {
    const { userId, contactId, startDate, endDate, isVerified } = req.query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (contactId) where.contactId = contactId;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (startDate || endDate) {
      where.checkInAt = {};
      if (startDate) where.checkInAt.gte = new Date(startDate as string);
      if (endDate) where.checkInAt.lte = new Date(endDate as string);
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        contact: {
          select: { id: true, name: true, type: true }
        },
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { checkInAt: 'desc' }
    });

    res.json({ visits });
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
};

// GET /visits/:id - Get single visit
export const getVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        contact: true,
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ visit });
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
};

// GET /visits/stats/summary - Get visit statistics
export const getVisitStats = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.checkInAt = {};
      if (startDate) where.checkInAt.gte = new Date(startDate as string);
      if (endDate) where.checkInAt.lte = new Date(endDate as string);
    }

    const [totalVisits, verifiedVisits, completedVisits] = await Promise.all([
      prisma.visit.count({ where }),
      prisma.visit.count({ where: { ...where, isVerified: true } }),
      prisma.visit.count({ where: { ...where, checkOutAt: { not: null } } })
    ]);

    res.json({
      totalVisits,
      verifiedVisits,
      completedVisits,
      verificationRate: totalVisits > 0 ? ((verifiedVisits / totalVisits) * 100).toFixed(1) + '%' : '0%',
      completionRate: totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(1) + '%' : '0%'
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
```

**api/src/routes/visits.ts**:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  checkIn,
  checkOut,
  getVisits,
  getVisit,
  getVisitStats
} from '../controllers/visits';

const router = Router();

router.use(authenticateToken);

router.post('/check-in', checkIn);
router.put('/:id/check-out', checkOut);
router.get('/', getVisits);
router.get('/stats/summary', getVisitStats);
router.get('/:id', getVisit);

export default router;
```

### Update server.ts:
```typescript
// Add to api/src/server.ts
import visitsRoutes from './routes/visits';

app.use('/visits', visitsRoutes);
```

### Success Criteria:
- [ ] Visits table created
- [ ] Check-in endpoint validates GPS within 100m
- [ ] Distance calculation working
- [ ] Visit statistics endpoint functional

---

## 10:00 AM - 11:30 AM: Photo Upload with AWS S3 Presigned URLs

### Install Dependencies:
```bash
cd api
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
```

### Files to Create:

**api/src/utils/s3.ts**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'field-force-crm';

export async function generateUploadUrl(fileType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
  const fileName = `visits/${crypto.randomUUID()}.${fileType.split('/')[1]}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: fileType
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

  return { uploadUrl, fileUrl };
}
```

**api/src/routes/upload.ts**:
```typescript
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { generateUploadUrl } from '../utils/s3';

const router = Router();

router.use(authenticateToken);

// POST /upload/presigned-url - Get presigned URL for upload
router.post('/presigned-url', async (req: Request, res: Response) => {
  try {
    const { fileType } = req.body;

    if (!fileType) {
      return res.status(400).json({ error: 'File type is required' });
    }

    const { uploadUrl, fileUrl } = await generateUploadUrl(fileType);

    res.json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

export default router;
```

### Update server.ts:
```typescript
import uploadRoutes from './routes/upload';
app.use('/upload', uploadRoutes);
```

### Add to .env:
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=field-force-crm
```

### Success Criteria:
- [ ] Presigned URL generation working
- [ ] URLs expire after 5 minutes
- [ ] File uploads to S3 successfully

---

## 11:30 AM - 1:00 PM: Frontend Visit Check-In Page

### Files to Create:

**web/src/pages/VisitCheckIn.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function VisitCheckIn() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [contact, setContact] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    fetchContact();
    getCurrentLocation();
  }, []);

  const fetchContact = async () => {
    try {
      const response = await fetch(`http://localhost:5000/contacts/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setContact(data.contact);
    } catch (error) {
      console.error('Failed to fetch contact:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setLocationError('Failed to get location: ' + error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photo) return null;

    try {
      // Get presigned URL
      const presignedResponse = await fetch('http://localhost:5000/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileType: photo.type })
      });

      const { uploadUrl, fileUrl } = await presignedResponse.json();

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: photo,
        headers: { 'Content-Type': photo.type }
      });

      return fileUrl;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error('Failed to upload photo');
    }
  };

  const handleCheckIn = async () => {
    if (!location) {
      setError('Location is required. Please enable GPS.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload photo first
      let photoUrl = null;
      if (photo) {
        photoUrl = await uploadPhoto();
      }

      // Check in
      const response = await fetch('http://localhost:5000/visits/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contactId,
          latitude: location.latitude,
          longitude: location.longitude,
          photoUrl,
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check in');
      }

      const data = await response.json();

      alert(data.message);
      navigate('/visits');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Check In to Visit</h1>

          {contact && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-2">{contact.name}</h2>
              <p className="text-gray-600">Type: {contact.type}</p>
              {contact.phone && <p className="text-gray-600">Phone: {contact.phone}</p>}
              {contact.address && <p className="text-gray-600">Address: {contact.address}</p>}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {locationError && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg">
                {locationError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Location
              </label>
              {location ? (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg">
                  <p>✓ Location captured</p>
                  <p className="text-xs mt-1">
                    Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                  Getting location...
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="mt-4 w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={4}
                placeholder="Add any notes about this visit..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCheckIn}
                disabled={loading || !location}
                className="flex-1 bg-primary-800 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-semibold"
              >
                {loading ? 'Checking In...' : 'Check In'}
              </button>
              <button
                onClick={() => navigate('/contacts')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

### Success Criteria:
- [ ] GPS location captured automatically
- [ ] Camera opens for photo capture
- [ ] Photo preview shown
- [ ] Check-in creates visit record
- [ ] Success/error messages displayed

---

## 2:00 PM - 3:00 PM: Visits List Page

### Files to Create:

**web/src/pages/Visits.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface Visit {
  id: string;
  checkInAt: string;
  checkOutAt?: string;
  isVerified: boolean;
  contact: {
    name: string;
    type: string;
  };
  user: {
    name: string;
  };
  notes?: string;
  distanceFromContact?: number;
}

export default function Visits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    userId: '',
    isVerified: '',
    startDate: '',
    endDate: ''
  });
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVisits();
    fetchStats();
  }, [filter]);

  const fetchVisits = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`http://localhost:5000/visits?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setVisits(data.visits);
    } catch (error) {
      console.error('Failed to fetch visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.userId) params.append('userId', filter.userId);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const response = await fetch(`http://localhost:5000/visits/stats/summary?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return 'In Progress';
    const duration = Math.floor(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 1000 / 60
    );
    return `${duration} min`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Visit History</h1>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-3xl font-bold text-primary-800">{stats.totalVisits}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Verified Visits</p>
                <p className="text-3xl font-bold text-green-600">{stats.verifiedVisits}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Completed Visits</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completedVisits}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Verification Rate</p>
                <p className="text-3xl font-bold text-amber-600">{stats.verificationRate}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={filter.isVerified}
                onChange={(e) => setFilter({ ...filter, isVerified: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Visits</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
              <button
                onClick={() => setFilter({ userId: '', isVerified: '', startDate: '', endDate: '' })}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Visits List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{visit.contact.name}</div>
                      <div className="text-sm text-gray-500">{visit.contact.type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(visit.checkInAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {calculateDuration(visit.checkInAt, visit.checkOutAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {visit.isVerified ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Not Verified
                          </span>
                        )}
                        {visit.distanceFromContact !== null && (
                          <span className="text-xs text-gray-500">
                            {Math.round(visit.distanceFromContact)}m away
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => navigate(`/visits/${visit.id}`)}
                        className="text-primary-800 hover:text-teal-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visits.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No visits found. Check in to a contact to create your first visit.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

### Success Criteria:
- [ ] Visits list displays all visits
- [ ] Stats cards show correct metrics
- [ ] Date filter works
- [ ] Verification status displayed
- [ ] Distance from contact shown

---

## 3:00 PM - 4:00 PM: Add Check-In Button to Contacts Page

### Update Contacts.tsx:
```typescript
// Add check-in button to each contact row
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
  <button
    onClick={() => navigate(`/visits/check-in/${contact.id}`)}
    className="text-primary-800 hover:text-teal-900 mr-4"
  >
    Check In
  </button>
  <button
    onClick={() => navigate(`/contacts/${contact.id}`)}
    className="text-blue-600 hover:text-blue-900 mr-4"
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
```

### Update App.tsx routing:
```typescript
<Route path="/visits" element={<Visits />} />
<Route path="/visits/check-in/:contactId" element={<VisitCheckIn />} />
<Route path="/visits/:id" element={<VisitDetails />} />
```

---

## 4:00 PM - 4:30 PM: Testing & Bug Fixes

### Manual Test Checklist:
- [ ] Check in to a contact with GPS within 100m (should be verified)
- [ ] Check in to a contact from far away (should be unverified)
- [ ] Upload photo during check-in
- [ ] View visit in visits list
- [ ] Filter visits by date
- [ ] Filter visits by verification status
- [ ] Check stats are calculating correctly

### Common Issues to Fix:
- GPS permission denied → Add error handling
- Photo upload fails → Check S3 credentials
- Distance calculation wrong → Verify Haversine formula
- Timezone issues → Use UTC consistently

---

## 4:30 PM - 5:00 PM: Git Commit & Documentation

### Commands:
```bash
git add .
git commit -m "Day 3: Implement visit tracking module

- Add visits table with GPS verification
- Create check-in/check-out endpoints
- Implement distance calculation (Haversine formula)
- Add photo upload with S3 presigned URLs
- Build visit check-in page with GPS capture
- Create visits history page with filters
- Add visit statistics dashboard
- Integrate check-in button in contacts page

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

---

## 5:00 PM - 5:30 PM: Day 3 Review & Day 4 Planning

### Review Checklist:
- [ ] Visit check-in working with GPS
- [ ] Photo upload to S3 successful
- [ ] Distance verification within 100m working
- [ ] Visit history displaying correctly
- [ ] Statistics calculating accurately

### Day 4 Preview:
Tomorrow we will implement:
- Order management module
- Product catalog
- Order creation from visits
- Order approval workflow
- Order history and reports

---

## End of Day 3

**Total Time**: 8 hours
**Status**: Visit tracking complete with GPS verification
**Next**: Day 4 - Order Management Module
