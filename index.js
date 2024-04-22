const express=require('express');
const app=express();
const cors = require('cors');
const bodyparser=require('body-parser')

const authRoutes=require('./routes/auth')
const userRoutes=require('./routes/user')

require('dotenv').config();

app.use(cors());

app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());

app.use('/auth',authRoutes);
app.use('/user',userRoutes);
app.listen(process.env.PORT);