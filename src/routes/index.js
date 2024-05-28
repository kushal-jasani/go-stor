const express = require('express');

const authRoutes = require('./auth');
const homeRoutes = require('./home');
const userRoutes = require('./user');
const productRoutes = require('./products');
const addressRoutes = require('./address');
const orderRoutes = require('./order');
const couponRoutes = require('./coupons');
const storeRoutes = require('./store');

const router = express.Router();

router.use(homeRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/shop', productRoutes);
router.use('/orders', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/store', storeRoutes);

module.exports = router;