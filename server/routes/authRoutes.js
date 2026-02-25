import express from 'express';
import { login, register } from '../controllers/authController.js';

const router = express.Router();

// Existing login route
router.post('/login', login);

// New register route
router.post('/register', register);

export default router;