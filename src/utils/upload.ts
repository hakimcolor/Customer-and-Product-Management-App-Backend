import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload folders exist
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir('uploads/products');
ensureDir('uploads/vouchers');
ensureDir('uploads/profiles');
ensureDir('uploads/company');

const storage = (folder: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = `uploads/${folder}`;
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (
    allowed.test(path.extname(file.originalname).toLowerCase()) &&
    allowed.test(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

export const productImageUpload = multer({
  storage: storage('products'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
export const voucherUpload = multer({
  storage: storage('vouchers'),
  limits: { fileSize: 5 * 1024 * 1024 },
});
export const profileUpload = multer({
  storage: storage('profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
export const companyLogoUpload = multer({
  storage: storage('company'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Convert saved file path → public URL  e.g.  uploads/products/abc.jpg  →  /uploads/products/abc.jpg
export const fileToUrl = (filePath: string): string =>
  '/' + filePath.replace(/\\/g, '/');
