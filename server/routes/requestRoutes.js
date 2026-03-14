import express from 'express';
import {
  createRequest,
  getAllRequests,
  getRequestById,
  addTask,
  toggleTask,
  addResource,
  deleteResource,
  acceptRequest,
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected: requires JWT
router.post('/', protect, createRequest);

// Public: anyone can browse requests
router.get('/', getAllRequests);

// Protected: tasks (author or helper only) — register before GET /:id
router.post('/:id/tasks', protect, addTask);
router.put('/:id/tasks/:taskId', protect, toggleTask);

router.post('/:id/resources', protect, addResource);
router.delete('/:id/resources/:resourceId', protect, deleteResource);

// Protected: accept a pending request
router.put('/:id/accept', protect, acceptRequest);

// Protected: single request (author or helper only)
router.get('/:id', protect, getRequestById);

export default router;

