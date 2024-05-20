const express = require('express');

const couponController = require('../controller/coupons');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/', couponController.getCoupons);

router.get('/t&c/:couponId', couponController.getTermsByCouponId);

router.get('/apply', isAuth, couponController.applyCoupon);

module.exports = router;