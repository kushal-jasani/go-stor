const express = require('express');

const couponController = require('../controller/coupons');
const { isAuth } = require('../middleware/isAuth');

const router = express.Router();

router.get('/', isAuth, couponController.getCoupons);

router.get('/t&c/:couponId', isAuth, couponController.getTermsByCouponId);

router.get('/apply', isAuth, couponController.applyCoupon);

module.exports = router;