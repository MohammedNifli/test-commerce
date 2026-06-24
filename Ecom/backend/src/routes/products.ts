import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUploadProducts,
} from '../controllers/productsController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../../public/uploads');
const csvUploadsDir = path.join(__dirname, '../../public/csv-uploads');
[uploadsDir, csvUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for product images
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadImage = multer({ storage: imageStorage });

// Configure multer for bulk-upload files (CSV and Excel)
const ALLOWED_BULK_EXTS = ['.csv', '.xlsx', '.xls'];

const bulkStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, csvUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload-${Date.now()}${ext}`);
  },
});

const bulkFileFilter = (
  _req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_BULK_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .csv, .xlsx, and .xls files are allowed'));
  }
};

const uploadBulk = multer({ storage: bulkStorage, fileFilter: bulkFileFilter });

// Public routes
router.get('/', getProducts);

// Protected: bulk upload must come before /:id to avoid param capture
router.post('/bulk-upload', authenticateAdmin, uploadBulk.single('file'), bulkUploadProducts);
router.post('/bulk-delete', authenticateAdmin, bulkDeleteProducts);

router.get('/:id', getProductById);

// Protected: single product CRUD
router.post('/', authenticateAdmin, uploadImage.single('image'), createProduct);
router.put('/:id', authenticateAdmin, uploadImage.single('image'), updateProduct);
router.delete('/:id', authenticateAdmin, deleteProduct);

export default router;
