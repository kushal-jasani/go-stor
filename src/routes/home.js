const express = require('express');

const homeController = require('../controller/home');

const router = express.Router();

router.get('/home/', homeController.home);

router.get('/home/banner/:bannerId', homeController.getProductsByBannerId);

router.get('/about-us', homeController.getAboutUsCategory);

module.exports = router;