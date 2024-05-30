const express = require('express');

const homeController = require('../controller/home');
const { isAuth } = require('../middleware/isAuth');

const router = express.Router();

router.get('/home/', homeController.home);

router.get('/home/banner/:bannerId', homeController.getProductsByBannerId);

router.get('/about-us', homeController.getAboutUsCategory);

router.get('/referral', isAuth, homeController.getReferralDetails);

module.exports = router;