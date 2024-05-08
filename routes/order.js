const express = require('express');

const orderController = require('../controller/order');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/order-summary', isAuth, orderController.getOrderSummary);

router.post('/checkout', isAuth, orderController.getCheckout);

router.post('/checkout/success', isAuth, orderController.getCheckoutSuccess);

router.post('/checkout/cancel', isAuth, orderController.getCheckoutCancel);

module.exports = router;