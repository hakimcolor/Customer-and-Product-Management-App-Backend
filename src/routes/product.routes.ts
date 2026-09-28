import { Router } from 'express';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getProductStock, setOpeningStock, transferStock, getStockAlerts,
} from '../controllers/product.controller';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getBrands, createBrand, updateBrand, deleteBrand,
} from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Products
router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/:id/stock', getProductStock);

// Stock
router.post('/stock/opening', setOpeningStock);
router.post('/stock/transfer', transferStock);
router.get('/stock/alerts', getStockAlerts);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Brands
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

export default router;
