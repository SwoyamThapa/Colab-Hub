import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Colab Hub API is running' });
});

// API index
app.get('/api', (req, res) => {
  res.json({
    name: 'Colab Hub API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/projects', '/api/auth/login'],
  });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Colab Hub server running at http://localhost:${PORT}`);
  });
};

startServer();
