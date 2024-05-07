const express = require('express');

const orderController = require('../controller/order');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.post('/order-summary', isAuth, orderController.getOrderSummary);

router.post('/checkout', isAuth, orderController.getCheckout);

router.post('/checkout/success', isAuth, orderController.getCheckoutSuccess);

router.post('/checkout/cancel', isAuth, orderController.getCheckout);

module.exports = router;