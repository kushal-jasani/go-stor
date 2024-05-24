require("dotenv").config();

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const { sendHttpResponse, generateResponse } = require("../helper/response");

exports.isAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return sendHttpResponse(req, res, next,
      generateResponse({
        statusCode: 401,
        status: "error",
        msg: 'Not authenticated.',
      })
    );
  }

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: err.message === 'invalid signature' ? 401 : 403,
        msg: err.message
      })
    );
  }
};