const express = require('express');

const addressController = require('../controller/address');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/address', isAuth, addressController.address);

router.get('/address/:addressId', isAuth, addressController.addressByAddressId);

router.post('/add-address', isAuth, addressController.addAddress);

router.delete('/delete-address/:addressId', isAuth, addressController.deleteAddress);

module.exports = router;