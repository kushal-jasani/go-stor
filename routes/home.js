const express = require('express');

const homeController = require('../controller/home');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

// router.get('/', isAuth, homeController.home);

module.exports = router;