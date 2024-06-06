const express = require('express');

const productController = require('../controller/products');

const router = express.Router();

router.get('/category', productController.getCategory);

router.get('/category/products/:categoryId', productController.getProductsByCategoryId);

router.get('/subCategory/products/:subCategoryId', productController.getProductsBySubCategoryId);

router.get('/product/:productId', productController.getProductByProductId);

router.get('/search', productController.search);

router.get('/search-suggestion', productController.searchSuggestions);

module.exports = router;