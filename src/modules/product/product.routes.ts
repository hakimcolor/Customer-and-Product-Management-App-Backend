import { Router } from 'express';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getBrands, createBrand, updateBrand, deleteBrand,
  getProducts, createProduct, getProduct, updateProduct, deleteProduct, getProductStock,
  setOpeningStock, transferStock, getStockAlerts, recordDamage, getDamages,
} from './product.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  categorySchema, brandSchema, productSchema,
  openingStockSchema, stockTransferSchema, damageSchema,
} from './product.validator';

const router = Router();
router.use(authenticate);

// Categories
router.get('/categories', getCategories);
router.post('/categories', authorize('ADMIN', 'MANAGER'), validate(categorySchema), createCategory);
router.put('/categories/:id', authorize('ADMIN', 'MANAGER'), validate(categorySchema), updateCategory);
router.delete('/categories/:id', authorize('ADMIN'), deleteCategory);

// Brands
router.get('/brands', getBrands);
router.post('/brands', authorize('ADMIN', 'MANAGER'), validate(brandSchema), createBrand);
router.put('/brands/:id', authorize('ADMIN', 'MANAGER'), validate(brandSchema), updateBrand);
router.delete('/brands/:id', authorize('ADMIN'), deleteBrand);

// Stock operations
router.post('/stock/opening', authorize('ADMIN', 'MANAGER'), validate(openingStockSchema), setOpeningStock);
router.post('/stock/transfer', authorize('ADMIN', 'MANAGER'), validate(stockTransferSchema), transferStock);
router.get('/stock/alerts', getStockAlerts);
router.get('/damages', getDamages);
router.post('/damages', authorize('ADMIN', 'MANAGER'), validate(damageSchema), recordDamage);

// Products
router.get('/', getProducts);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(productSchema), createProduct);
router.get('/:id', getProduct);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(productSchema.partial()), updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);
router.get('/:id/stock', getProductStock);

export default router;
