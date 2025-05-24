import express from 'express';
import { uploadFile } from '../controllers/uploadController.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// POST /api/upload - Upload a file
router.post('/', upload.single('image'), uploadFile);

export default router;
