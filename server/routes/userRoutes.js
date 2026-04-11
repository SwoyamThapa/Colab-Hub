import express from 'express';
import { getPublicProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register before /:id so "profile" is not captured as an id
router.put('/profile', protect, updateProfile);
router.get('/:id', getPublicProfile);

export default router;
