import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStock,
  setOpeningStock,
  adjustStock,
  transferStock,
  getStockTransfers,
  updateTransferStatus,
  getStockAlerts,
  recordDamage,
  getDamages,
  getStockAdjustments,
} from './product.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  categorySchema,
  brandSchema,
  productSchema,
  openingStockSchema,
  stockTransferSchema,
  damageSchema,
} from './product.validator';

const router = Router();
router.use(authenticate);

// Categories
router.get('/categories', getCategories);
router.post(
  '/categories',
  authorize('ADMIN', 'MANAGER'),
  validate(categorySchema),
  createCategory
);
router.put(
  '/categories/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(categorySchema),
  updateCategory
);
router.delete('/categories/:id', authorize('ADMIN'), deleteCategory);

// Sub-Categories
router.get('/sub-categories', getSubCategories);
router.post(
  '/sub-categories',
  authorize('ADMIN', 'MANAGER'),
  createSubCategory
);
router.put(
  '/sub-categories/:id',
  authorize('ADMIN', 'MANAGER'),
  updateSubCategory
);
router.delete('/sub-categories/:id', authorize('ADMIN'), deleteSubCategory);

// Brands
router.get('/brands', getBrands);
router.post(
  '/brands',
  authorize('ADMIN', 'MANAGER'),
  validate(brandSchema),
  createBrand
);
router.put(
  '/brands/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(brandSchema),
  updateBrand
);
router.delete('/brands/:id', authorize('ADMIN'), deleteBrand);

// Units
router.get('/units', getUnits);
router.post('/units', authorize('ADMIN', 'MANAGER'), createUnit);
router.put('/units/:id', authorize('ADMIN', 'MANAGER'), updateUnit);
router.delete('/units/:id', authorize('ADMIN'), deleteUnit);

// Stock operations
router.post(
  '/stock/opening',
  authorize('ADMIN', 'MANAGER'),
  validate(openingStockSchema),
  setOpeningStock
);
router.post('/stock/adjust', authorize('ADMIN', 'MANAGER'), adjustStock);
router.get('/stock/adjustments', getStockAdjustments);
router.get('/stock/alerts', getStockAlerts);
router.get('/stock/transfers', getStockTransfers);
router.post(
  '/stock/transfers',
  authorize('ADMIN', 'MANAGER'),
  validate(stockTransferSchema),
  transferStock
);
router.patch(
  '/stock/transfers/:id/status',
  authorize('ADMIN', 'MANAGER'),
  updateTransferStatus
);
router.get('/damages', getDamages);
router.post(
  '/damages',
  authorize('ADMIN', 'MANAGER'),
  validate(damageSchema),
  recordDamage
);

// Products
router.get('/', getProducts);
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(productSchema),
  createProduct
);
router.get('/:id', getProduct);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);
router.get('/:id/stock', getProductStock);

export default router;
