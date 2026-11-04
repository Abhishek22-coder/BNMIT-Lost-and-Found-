import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB, dbService } from './src/database.js';
import { validateUSNAndEmail } from './src/validation.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure JSON parser limits to support clear Base64 image transfers from file uploads safely
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // Initialize DB Connection (Non-blocking async to guarantee instant web server startup)
  dbService.init(false); // Default to robust zero-crash Local JSON immediately
  connectDB().then((isAtlasReady) => {
    if (isAtlasReady) {
      dbService.init(true);
    }
  }).catch((err) => {
    console.warn('⚠️ MongoDB Atlas initialization deferred, running on high-fidelity Local database fallback.', err);
  });

  // --- BACKEND API ROUTES ---

  // Health and Status API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      database: dbService.isUsingAtlas ? 'MongoDB Atlas' : 'Local JSON Emulator (Zero-Crash Fallback)',
      currentTime: new Date().toISOString()
    });
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { usn, email, name, branch } = req.body;

      if (!usn || !email || !name || !branch) {
        return res.status(400).json({ error: 'All fields (USN, Email, Name, Branch) are required.' });
      }

      // Check USN and Email rules format
      const validation = validateUSNAndEmail(usn, email);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      // Save Student Details in DB
      const student = await dbService.createStudent({
        usn: usn.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        branch: branch.trim(),
        year: validation.parsed?.year || '24'
      });

      res.status(200).json({
        success: true,
        message: 'Student logged in successfully',
        student: {
          usn: student.usn,
          email: student.email,
          name: student.name,
          branch: student.branch,
          year: student.year
        }
      });
    } catch (error: any) {
      console.error('Login controller error:', error);
      res.status(500).json({ error: 'Internal server error during login operations.' });
    }
  });

  // GET /api/items - Fetch all loss/found items
  app.get('/api/items', async (req, res) => {
    try {
      const items = await dbService.fetchItems();
      res.status(200).json(items);
    } catch (error: any) {
      console.error('Fetch items error:', error);
      res.status(500).json({ error: 'Failed to retrieve portal assets items.' });
    }
  });

  // POST /api/items/add - Upload found or lost item
  app.post('/api/items/add', async (req, res) => {
    try {
      const { title, description, category, location, image, status, uploadedBy } = req.body;

      if (!title || !description || !category || !location || !status || !uploadedBy) {
        return res.status(400).json({ error: 'Mandatory fields missing for adding item record.' });
      }

      if (!uploadedBy.usn || !uploadedBy.name || !uploadedBy.email || !uploadedBy.branch) {
        return res.status(400).json({ error: 'Student uploader session context missing.' });
      }

      const item = await dbService.addItem({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location.trim(),
        image: image, // Base64 encoding
        status: status as 'lost' | 'found' | 'claimed',
        uploadedBy: {
          name: uploadedBy.name,
          usn: uploadedBy.usn,
          email: uploadedBy.email,
          branch: uploadedBy.branch
        }
      });

      res.status(201).json({
        success: true,
        message: 'Lost & found item successfully reported.',
        item
      });
    } catch (error: any) {
      console.error('Add item error:', error);
      res.status(500).json({ error: 'Failed to report lost or found item.' });
    }
  });

  // PUT /api/items/:id - Update item (for edit feature requested)
  app.put('/api/items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, category, location, image, status } = req.body;

      // Construct update payload selective of provided parameters
      const updatePayload: any = {};
      if (title !== undefined) updatePayload.title = title.trim();
      if (description !== undefined) updatePayload.description = description.trim();
      if (category !== undefined) updatePayload.category = category.trim();
      if (location !== undefined) updatePayload.location = location.trim();
      if (image !== undefined) updatePayload.image = image;
      if (status !== undefined) updatePayload.status = status;

      const updated = await dbService.updateItem(id, updatePayload);
      if (!updated) {
        return res.status(404).json({ error: `Item with ID ${id} not found.` });
      }

      res.status(200).json({
        success: true,
        message: 'Item updated successfully.',
        item: updated
      });
    } catch (error) {
      console.error('Update item error:', error);
      res.status(500).json({ error: 'Failed to update selected item details.' });
    }
  });

  // DELETE /api/items/:id - Simple delete item from database
  app.delete('/api/items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbService.deleteItem(id);

      if (!success) {
        return res.status(404).json({ error: `Item with ID ${id} not found.` });
      }

      res.status(200).json({
        success: true,
        message: 'Portal item has been deleted permanently.'
      });
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({ error: 'Failed to delete requested item.' });
    }
  });

  // POST /api/items/claim - Action to claim a portal item
  app.post('/api/items/claim', async (req, res) => {
    try {
      const { item_id, claimedBy } = req.body;

      if (!item_id || !claimedBy) {
        return res.status(400).json({ error: 'Claim requests require solid item_id and claimedBy student metadata.' });
      }

      if (!claimedBy.usn || !claimedBy.name || !claimedBy.email || !claimedBy.branch) {
        return res.status(400).json({ error: 'Claim student session attributes are missing.' });
      }

      // Check the item status first before allowing a claim rewrite
      const items = await dbService.fetchItems();
      const targetItem = items.find((itm: any) => String(itm._id) === String(item_id));

      if (!targetItem) {
        return res.status(404).json({ error: 'Target item not found.' });
      }

      if (targetItem.status === 'claimed') {
        return res.status(400).json({ error: 'This item has already been successfully claimed by another student.' });
      }

      // Create claim and status update
      const claim = await dbService.addClaim({
        item_id: String(item_id),
        item_title: targetItem.title,
        claimedBy: {
          name: claimedBy.name,
          usn: claimedBy.usn,
          email: claimedBy.email,
          branch: claimedBy.branch
        },
        uploadedBy: {
          name: targetItem.uploadedBy.name,
          usn: targetItem.uploadedBy.usn,
          email: targetItem.uploadedBy.email,
          branch: targetItem.uploadedBy.branch
        },
        claimedAt: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Item claimed successfully. Student uploader has been notified.',
        claim
      });
    } catch (error) {
      console.error('Claim item request error:', error);
      res.status(500).json({ error: 'Failed to claim original reported asset item.' });
    }
  });

  // --- REQUESTED ITEMS & INBOX MESSAGES API ---

  // GET /api/requests - Fetch all requested items
  app.get('/api/requests', async (req, res) => {
    try {
      const requests = await dbService.fetchRequests();
      res.status(200).json(requests);
    } catch (error) {
      console.error('Fetch requests error:', error);
      res.status(500).json({ error: 'Failed to retrieve requested items.' });
    }
  });

  // POST /api/requests/add - Add a new requested item
  app.post('/api/requests/add', async (req, res) => {
    try {
      const { title, description, category, location, image, requester } = req.body;

      if (!title || !description || !category || !location || !requester) {
        return res.status(400).json({ error: 'Mandatory fields missing for adding request record.' });
      }

      if (!requester.usn || !requester.name || !requester.email || !requester.branch) {
        return res.status(400).json({ error: 'Student requester session context missing.' });
      }

      const requestItem = await dbService.addRequest({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location.trim(),
        image: image, // Base64 encoding
        requester: {
          name: requester.name,
          usn: requester.usn,
          email: requester.email,
          branch: requester.branch
        }
      });

      res.status(201).json({
        success: true,
        message: 'Item request filed and registered successfully.',
        request: requestItem
      });
    } catch (error) {
      console.error('Add request error:', error);
      res.status(500).json({ error: 'Failed to report item request.' });
    }
  });

  // GET /api/messages/:usn - Fetch messages for specific student USN
  app.get('/api/messages/:usn', async (req, res) => {
    try {
      const { usn } = req.params;
      if (!usn) {
        return res.status(400).json({ error: 'Student USN is required to retrieve messages.' });
      }
      const messages = await dbService.fetchMessages(usn);
      res.status(200).json(messages);
    } catch (error) {
      console.error('Fetch messages error:', error);
      res.status(500).json({ error: 'Failed to retrieve inbox messages.' });
    }
  });

  // POST /api/messages/add - Submit "I Have This Item" message matching a request
  app.post('/api/messages/add', async (req, res) => {
    try {
      const { requestId, requestTitle, messageText, sender, recipientUsn } = req.body;

      if (!requestId || !requestTitle || !messageText || !sender || !recipientUsn) {
        return res.status(400).json({ error: 'Mandatory message fields missing.' });
      }

      if (!sender.usn || !sender.name || !sender.email) {
        return res.status(400).json({ error: 'Sender details missing.' });
      }

      const message = await dbService.addMessage({
        requestId,
        requestTitle: requestTitle.trim(),
        messageText: messageText.trim(),
        sender: {
          name: sender.name,
          usn: sender.usn,
          email: sender.email
        },
        recipientUsn: recipientUsn.toUpperCase()
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully to original requester.',
        messageObj: message
      });
    } catch (error) {
      console.error('Add message error:', error);
      res.status(500).json({ error: 'Failed to send inbox response message.' });
    }
  });

  // --- ASSET SERVING & INTEGRATION MIDDLEWARE ---

  if (process.env.NODE_ENV !== 'production') {
    // Vite middleware for lightning-fast frontend dev server routing
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static delivery from bundle path
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start the server bound to all incoming interfaces on Port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BNMIT Lost & Found backend listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
