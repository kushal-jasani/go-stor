const express=require('express');
const authController=require('../controller/auth');
const router=express.Router();

router.post('/register',authController.register);
router.post('/verifyregisterotp',authController.verifyRegisterOTP);

router.post('/login',authController.logIn);
router.post('/verifyloginotp',authController.varifyLoginOTP);

router.post('/resendotp',authController.resendOtp);


module.exports=router;