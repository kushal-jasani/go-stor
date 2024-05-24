const express = require('express');

const homeController = require('../controller/home');

const router = express.Router();

router.get('/', homeController.home);

router.get('/banner/:bannerId', homeController.getProductsByBannerId);

module.exports = router;