const express = require('express');

const productController = require('../controller/products');

const router = express.Router();

router.get('/category', productController.getCategory);

router.get('/category/products/:categoryId', productController.getProductsByCategoryId);

router.get('/subCategory/products/:subCategoryId', productController.getProductsBySubCategoryId);

router.get('/product/:productId', productController.getProductByProductId);

router.get('/search', productController.search);

router.post('/get-filter', productController.showFilter);

module.exports = router;