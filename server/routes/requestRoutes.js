import express from 'express';
import {
  createRequest,
  getAllRequests,
  getRequestById,
  getChatHistory,
  addTask,
  toggleTask,
  assignTask,
  addResource,
  removeResource,
  addCustomRole,
  updateProjectRole,
  updateControlRole,
  saveScratchpad,
  deleteRequest,
  updateRequestStatus,
  acceptRequest,
  applyForProject,
  manageApplicant,
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
router.put('/:id/tasks/:taskId/assign', protect, assignTask);

router.post('/:id/resources', protect, addResource);
router.delete('/:id/resources/:resourceId', protect, removeResource);

// Protected: accept a pending request
router.put('/:id/accept', protect, acceptRequest);

router.post('/:id/apply', protect, applyForProject);
router.put('/:id/applicants/:applicantId', protect, manageApplicant);

router.post('/:id/customRoles', protect, addCustomRole);
router.put('/:id/projectRole', protect, updateProjectRole);
router.put('/:id/controlRole', protect, updateControlRole);

router.put('/:id/scratchpad', protect, saveScratchpad);

router.get('/:id/messages', protect, getChatHistory);

// Protected: author (Project Lead) can delete/update their request
router.delete('/:id', protect, deleteRequest);
router.put('/:id/status', protect, updateRequestStatus);

// Protected: single request (author or helper only)
router.get('/:id', protect, getRequestById);

export default router;

