const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')



require('dotenv').config();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.listen(process.env.PORT);