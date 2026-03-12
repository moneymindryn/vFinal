import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { doc, deleteDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load Firebase config for the server
  const firebaseConfigPath = path.join(__dirname, 'src', 'firebase-applet-config.json');
  let db: any;

  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  }

  // API Routes
  app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    
    if (!db) {
      return res.status(500).json({ error: 'Firebase not configured on server' });
    }

    try {
      await deleteDoc(doc(db, 'orders', id));
      res.json({ message: 'Order deleted successfully', id });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    
    if (!db) {
      return res.status(500).json({ error: 'Firebase not configured on server' });
    }

    try {
      await deleteDoc(doc(db, 'users', id));
      res.json({ message: 'User deleted successfully', id });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
