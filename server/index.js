import * as dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import Message from './models/Message.js';
import ProjectRequest from './models/ProjectRequest.js';

console.log(
  'Loaded API Key:',
  process.env.GEMINI_API_KEY
    ? process.env.GEMINI_API_KEY.substring(0, 5) + '...'
    : 'UNDEFINED'
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
console.log('Bot is active on Free Tier.');

const app = express();
const PORT = process.env.PORT || 5001;

function canAccessWorkspaceForSocket(requestDoc, userId) {
  const authorId =
    requestDoc.author?._id?.toString?.() ?? String(requestDoc.author);
  const helperId = requestDoc.helper
    ? requestDoc.helper?._id?.toString?.() ?? String(requestDoc.helper)
    : null;
  const uid = String(userId);
  if (authorId === uid) return true;
  if (helperId != null && helperId === uid) return true;
  return false;
}

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Colab Hub API is running' });
});

// API index
app.get('/api', (req, res) => {
  res.json({
    name: 'Colab Hub API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/projects',
      '/api/auth/login',
      '/api/auth/register',
      '/api/requests',
      '/api/users',
    ],
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  socket.on('join_workspace', (requestId) => {
    if (requestId != null && requestId !== '') {
      socket.join(String(requestId));
    }
  });

  socket.on('leave_workspace', (requestId) => {
    if (requestId != null && requestId !== '') {
      socket.leave(String(requestId));
    }
  });

  socket.on('send_message', async ({ requestId, senderId, text }) => {
    try {
      if (!requestId || !senderId || typeof text !== 'string') {
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      const request = await ProjectRequest.findById(requestId);
      if (!request || !canAccessWorkspaceForSocket(request, senderId)) {
        return;
      }

      const doc = await Message.create({
        request: requestId,
        sender: senderId,
        text: trimmed,
      });

      const savedMessage = await Message.findById(doc._id)
        .populate('sender', 'name')
        .lean();

      io.to(String(requestId)).emit('receive_message', savedMessage);

      if (trimmed.includes('@ColabBot')) {
        const prompt = trimmed.replace('@ColabBot', '').trim();
        const botUserId = process.env.BOT_USER_ID;

        const saveAndEmitBotMessage = async (messageText) => {
          if (!botUserId) {
            return;
          }
          const botDoc = await Message.create({
            request: requestId,
            sender: botUserId,
            text: messageText,
          });
          const populatedBotMessage = await Message.findById(botDoc._id)
            .populate('sender', 'name')
            .lean();
          io.to(String(requestId)).emit('receive_message', populatedBotMessage);
        };

        if (!botUserId) {
          console.error('ColabBot: BOT_USER_ID is not set; cannot post bot messages.');
        } else if (!process.env.GEMINI_API_KEY) {
          console.error('ColabBot: GEMINI_API_KEY is not set.');
          try {
            await saveAndEmitBotMessage(
              'ColabBot is not configured: add GEMINI_API_KEY on the server.'
            );
          } catch (err) {
            console.error('ColabBot: failed to save missing-key notice', err);
          }
        } else if (!prompt) {
          try {
            await saveAndEmitBotMessage(
              'ColabBot: add a message after @ColabBot, e.g. @ColabBot Summarize the project status.'
            );
          } catch (err) {
            console.error('ColabBot: failed to save empty-prompt notice', err);
          }
        } else {
          try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(prompt);
            const botResponse = result.response.text();

            const botDoc = await Message.create({
              request: requestId,
              sender: botUserId,
              text: botResponse,
            });
            const populatedBotMessage = await Message.findById(botDoc._id)
              .populate('sender', 'name')
              .lean();
            io.to(String(requestId)).emit('receive_message', populatedBotMessage);
          } catch (err) {
            console.error('ColabBot AI error', err);
            try {
              await saveAndEmitBotMessage(
                "Sorry, ColabBot couldn't process that. Please try again in a moment."
              );
            } catch (innerErr) {
              console.error('ColabBot: failed to save error fallback', innerErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('send_message', err);
    }
  });
});

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Colab Hub server running at http://localhost:${PORT}`);
  });
};

startServer();
