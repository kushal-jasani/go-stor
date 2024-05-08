const express = require('express');

const couponController = require('../controller/coupons');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/', isAuth, couponController.getCoupons);

router.get('/t&c/:couponId', isAuth, couponController.getTermsByCouponId);

router.get('/apply/:couponId', isAuth, couponController.applyCoupon);

module.exports = router;