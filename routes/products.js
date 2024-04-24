const express = require('express');

const productController = require('../controller/products');

const router = express.Router();

router.get('/category', productController.getCategory);

router.get('/sub-category/:categoryId', productController.getSubCategory);

router.get('/products/category/:categoryId', productController.getProductsByCategoryId);

router.get('/products/subCategory/:subCategoryId', productController.getProductsBySubCategoryId);

module.exports = router;