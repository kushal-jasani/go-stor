const express = require('express');
const bodyParser = require('body-parser')

const orderController = require('../controller/order');
const { isAuth } = require('../middleware/is-auth');
const { isLogIn } = require('../middleware/is-login');

const router = express.Router();

router.get('/list', isAuth, orderController.getOrders);

router.get('/order/:orderId', isAuth, orderController.getOrderByOrderId);

router.get('/order-summary', isLogIn, orderController.getOrderSummary);

router.post('/checkout', isAuth, orderController.getCheckout);

router.post('/checkout/stripe/webhook', orderController.stripeWebhook);

module.exports = router;