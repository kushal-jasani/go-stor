const express = require('express');

const storeController = require('../controller/store');

const router = express.Router();

router.get('/', storeController.getStore);

router.get('/products/:storeId', storeController.getProductsByStoreId);

module.exports = router;