const express = require('express');

const orderController = require('../controller/order');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.post('/order-summary', isAuth, orderController.getOrderSummary);

router.post('/post-order', isAuth, orderController.postOrder);

module.exports = router;