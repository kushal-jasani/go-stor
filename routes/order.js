const express = require('express');

const orderController = require('../controller/order');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/list', isAuth, orderController.getOrders);

router.get('/order/:orderId', isAuth, orderController.getOrderByOrderId);

router.get('/order-summary', isAuth, orderController.getOrderSummary);

router.post('/checkout', isAuth, orderController.getCheckout);

router.post('/checkout/stripe/webhook', isAuth, orderController.stripeWebhook);

module.exports = router;