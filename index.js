const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const productRoutes = require('./routes/products');
const addressRoutes = require('./routes/address');
const orderRoutes = require('./routes/order');
const couponRoutes = require('./routes/coupons');
const storeRoutes = require('./routes/store');

require('dotenv').config();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/shop', productRoutes);
app.use('/orders', addressRoutes);
app.use('/orders', orderRoutes);
app.use('/coupons', couponRoutes);
app.use('/store', storeRoutes);
app.listen(process.env.PORT);