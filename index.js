require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')

const indexRoutes = require('./src/routes/index');

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
    verify: function (req, res, buf) {
        var url = req.originalUrl;
        if (url.startsWith('/orders/checkout/stripe/webhook')) {
            req.rawBody = buf.toString()
        }
    }
}));

app.use(indexRoutes);

app.listen(process.env.PORT);