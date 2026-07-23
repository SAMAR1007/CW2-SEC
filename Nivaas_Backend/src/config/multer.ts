import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/users');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `user-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|avif|heic|heif|bmp|tiff|tif|svg/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/');

  // Accept if mimetype is image/* OR if the extension is a known image type
  // (some clients send application/octet-stream for valid images)
  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Host document upload (government ID: images + PDF)
const hostsDir = path.join(__dirname, '../../uploads/hosts');
if (!fs.existsSync(hostsDir)) {
  fs.mkdirSync(hostsDir, { recursive: true });
}

const hostStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, hostsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `host-doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const hostFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/\w+|application\/pdf/.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images and PDF are allowed for government ID'));
};

export const hostDocumentUpload = multer({
  storage: hostStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: hostFileFilter,
});

const listingsDir = path.join(__dirname, '../../uploads/listings');
if (!fs.existsSync(listingsDir)) {
  fs.mkdirSync(listingsDir, { recursive: true });
}

const listingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, listingsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `listing-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const listingImagesUpload = multer({
  storage: listingStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter,
});
