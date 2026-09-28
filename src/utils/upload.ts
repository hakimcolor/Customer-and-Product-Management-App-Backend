import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = (folder: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, `uploads/${folder}/`),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files are allowed'));
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
