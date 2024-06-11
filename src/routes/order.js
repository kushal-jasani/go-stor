const express = require('express');

const orderController = require('../controller/order');
const { isAuth } = require('../middleware/isAuth');
const { isLogIn } = require('../middleware/isLogin');

const router = express.Router();

router.get('/list', isAuth, orderController.getOrders);

router.get('/order/:orderId', isAuth, orderController.getOrderByOrderItemId);

router.get('/order-summary', isLogIn, orderController.getOrderSummary);

router.post('/checkout', isAuth, orderController.getCheckout);

router.get('/checkout/success', isAuth, orderController.getCheckoutSuccess);

router.post('/checkout/stripe/webhook', orderController.stripeWebhook);

module.exports = router;