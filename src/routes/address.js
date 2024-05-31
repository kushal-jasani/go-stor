const express = require('express');

const addressController = require('../controller/address');
const { isAuth } = require('../middleware/isAuth');

const router = express.Router();

router.get('/address', isAuth, addressController.address);

router.get('/change-primary-address/:addressId', isAuth, addressController.changePrimaryAddress);

router.post('/add-address', isAuth, addressController.addAddress);

router.delete('/delete-address/:addressId', isAuth, addressController.deleteAddress);

module.exports = router;