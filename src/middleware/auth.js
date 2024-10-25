
import express from 'express';
import { register, login, verifyEmail, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { validateUser } from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, validateUser, register);
router.post('/login', authLimiter, validateUser, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/request-reset', authLimiter, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPassword);

export default router;

// src/routes/contacts.js
import express from 'express';
import multer from 'multer';
import { 
  createContact, 
  getContacts, 
  updateContact, 
  deleteContact, 
  uploadContacts, 
  downloadContacts 
} from '../controllers/contactController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateContact } from '../middleware/validator.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication to all contact routes
router.use(authenticateToken);
router.use(apiLimiter);

router.post('/', validateContact, createContact);
router.get('/', getContacts);
router.put('/:id', validateContact, updateContact);
router.delete('/:id', deleteContact);
router.post('/upload', upload.single('file'), uploadContacts);
router.get('/download', downloadContacts);

export default router;