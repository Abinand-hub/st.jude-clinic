import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { clinicStore } from './server/dataStore.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());
  app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '10mb' }));

  // Version counter for live update polling
  let dataVersion = Date.now();
  const notifyDataChanged = () => { dataVersion = Date.now(); };

  // --- API ROUTES ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/version', (req, res) => {
    res.json({ version: dataVersion });
  });

  // Auth / Quick Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = clinicStore.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: `User with email '${email}' not found.` });
    }
    
    // Validate password based on user object password
    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid password.' });
    }
    // Fallback if password isn't set
    if (!user.password) {
      if (user.role === 'manager' && password !== 'manager123') {
        return res.status(401).json({ error: 'Invalid manager password.' });
      }
      if (user.role === 'staff' && password !== 'staff123') {
        return res.status(401).json({ error: 'Invalid staff password.' });
      }
    }

    res.json({ user, token: `mock_jwt_${user.id}` });
  });

  // Get Users / Staff Roster
  app.get('/api/users', (req, res) => {
    const users = clinicStore.getUsers();
    res.json(users);
  });

  // Create New User
  app.post('/api/users', (req, res) => {
    const { name, email, password, role, profession, phone } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }
    if (role === 'staff' && !profession) {
      return res.status(400).json({ error: 'Profession is required for staff members.' });
    }

    // Check if user already exists
    const existing = clinicStore.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const newUser = clinicStore.addUser({ name, email, password, role, profession, phone });
    res.status(201).json(newUser);
  });

  // Update Existing User
  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, profession, phone } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }

    const existingUser = clinicStore.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check email collision
    const existingEmail = clinicStore.getUserByEmail(email);
    if (existingEmail && existingEmail.id !== id) {
      return res.status(409).json({ error: 'Another user is already using this email.' });
    }

    const updatedUser = clinicStore.updateUser(id, { name, email, password, role, profession, phone });
    res.json(updatedUser);
  });

  // Get Shifts with claims & missing roles
  app.get('/api/shifts', (req, res) => {
    const shifts = clinicStore.getShiftsWithClaims();
    res.json({ shifts, version: dataVersion });
  });

  // Create Shift (Manager only)
  app.post('/api/shifts', async (req, res) => {
    try {
      const { shiftData, isRecurring, repeatWeeks } = req.body;
      if (!shiftData || !shiftData.title || !shiftData.date || !shiftData.startTime || !shiftData.endTime) {
        return res.status(400).json({ error: 'Missing required shift fields (title, date, startTime, endTime).' });
      }

      const created = await clinicStore.createShift(shiftData, !!isRecurring, repeatWeeks || 4);
      notifyDataChanged();
      res.status(201).json({ shifts: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create shift.' });
    }
  });

  // Update Shift (Manager only)
  app.put('/api/shifts/:id', async (req, res) => {
    try {
      const shiftId = req.params.id;
      const updatedFields = req.body;

      const result = await clinicStore.updateShift(shiftId, updatedFields);
      notifyDataChanged();
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update shift.' });
    }
  });

  // Delete Shift (Manager only)
  app.delete('/api/shifts/:id', async (req, res) => {
    try {
      const shiftId = req.params.id;
      const deleteSeries = req.query.deleteSeries === 'true';

      const count = await clinicStore.deleteShift(shiftId, deleteSeries);
      notifyDataChanged();
      res.json({ success: true, count });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete shift.' });
    }
  });

  // Claim Shift (Staff claim or Manager assignment)
  app.post('/api/claims', async (req, res) => {
    try {
      const { userId, shiftId, assignedByManager, managerUserId } = req.body;
      if (!userId || !shiftId) {
        return res.status(400).json({ error: 'userId and shiftId are required.' });
      }

      const claim = await clinicStore.claimShift(userId, shiftId, !!assignedByManager, managerUserId);
      notifyDataChanged();
      res.status(201).json({ claim });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to claim shift.' });
    }
  });

  // Unclaim / Revoke Shift Claim
  app.delete('/api/claims/:id', async (req, res) => {
    try {
      const claimId = req.params.id;
      const { requestingUserId, requestingRole } = req.body;

      await clinicStore.unclaimShift(claimId, requestingUserId, requestingRole || 'staff');
      notifyDataChanged();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to unclaim shift.' });
    }
  });

  // Import Reports
  app.get('/api/reports/import', (req, res) => {
    const reports = clinicStore.getImportReports();
    res.json(reports);
  });

  // Upload Dirty CSV
  app.post('/api/reports/import', async (req, res) => {
    try {
      const csvText = typeof req.body === 'string' ? req.body : req.body.csvText;
      const fileName = req.query.fileName as string || 'Custom_Import.csv';

      if (!csvText || !csvText.trim()) {
        return res.status(400).json({ error: 'CSV text content is required.' });
      }

      const report = await clinicStore.importCustomCsv(csvText, fileName);
      notifyDataChanged();
      res.json(report);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'CSV Import failed.' });
    }
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 St. Jude Clinic Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
