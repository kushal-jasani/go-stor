const express=require('express');
const userController=require('../controller/user');
const {isAuth}=require('../middleware/is-auth');

const router=express.Router();

router.get('/details',isAuth,userController.userDetail)

module.exports=router;