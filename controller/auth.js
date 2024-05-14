require("dotenv").config();
const otpless = require("otpless-node-js-auth-sdk");
const { generateResponse, sendHttpResponse } = require("../helper/response");
const clientId = process.env.OTPLESS_CLIENTID;
const clientSecret = process.env.OTPLESS_CLIETSECRET;

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../util/jwt");

const {
  findUser,
  insertUser
} = require("../repository/auth");

const {
  sendOtpSchema,
  verifyRegisterOtpSchema,
  verifyLoginOtpSchema,
  refreshAccessTokenSchema,
  resendOtpSchema
} = require("../helper/auth_validation_schema");

exports.register = async (req, res, next) => {
  const { error } = sendOtpSchema.validate(req.body);
  if (error) {
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 400,
        msg: error.details[0].message
      })
    );
  }
  try {
    const { phoneno } = req.body;
    let [userResults] = await findUser(phoneno);

    if (userResults.length > 0) {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 400,
          status: "error",
          msg: "User with this phone number already registered👀",
        })
      );
    }

    const phonewithcountrycode = "+91" + phoneno;
    const response = await otpless.sendOTP(phonewithcountrycode, "", "SMS", "", "", 600, 4, clientId, clientSecret);
    if (response.success === false) {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 400,
          status: "error",
          msg: "Failed to generate OTP❌",
        })
      );
    } else {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 201,
          status: "success",
          msg: "Otp sent successfully on given mobile number🚀",
          data: {
            otpid: response.orderId,
            // otpid: 'Otp_1A92DDDBBD014A5680909AE2CB2B4C72',
          },
        })
      );
    }
  } catch (error) {
    console.log("error while registering user", error);
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 500,
        msg: "internal server error",
      })
    );
  }
};

exports.verifyRegisterOTP = async (req, res, next) => {
  const { error } = verifyRegisterOtpSchema.validate(req.body);
  if (error) {
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 400,
        msg: error.details[0].message
      })
    );
  }
  try {
    const { name, email, phoneno, referral, otpid, enteredotp } = req.body;
    const phonewithcountrycode = "+91" + phoneno;
    const varificationresponse = await otpless.verifyOTP("", phonewithcountrycode, otpid, enteredotp, clientId, clientSecret);

    if (varificationresponse.success === false) {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 404,
          status: "error",
          msg: varificationresponse.errorMessage,
        })
      );
    }
    if (varificationresponse.isOTPVerified === true) {
      const [userResults] = await insertUser(name, email, phoneno, referral);
      const accessToken = generateAccessToken(userResults.insertId);
      const refreshToken = generateRefreshToken(userResults.insertId);
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 201,
          status: "success",
          msg: "User registerd successfully✅",
          data: {
            JWTToken: { accessToken, refreshToken },
          }
        })
      );
    }
    return sendHttpResponse(req, res, next,
      generateResponse({
        statusCode: 404,
        status: "error",
        msg: varificationresponse.reason ? varificationresponse.reason : "entered otp is wrong,please try again😓",
      })
    );
  } catch (error) {
    console.log(error);
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 500,
        msg: "internal server error",
      })
    );
  }
};

exports.logIn = async (req, res, next) => {
  const { error } = sendOtpSchema.validate(req.body);
  if (error) {
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 400,
        msg: error.details[0].message
      })
    );
  }
  try {
    const { phoneno } = req.body;
    const phonewithcountrycode = "+91" + phoneno;

    const [userResults] = await findUser(phoneno);
    const user = userResults[0];
    if (!user) {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 404,
          status: "error",
          msg: "user with given phone number is not registered already❌",
        })
      );
    }
    const response = await otpless.sendOTP(phonewithcountrycode, "", "SMS", "", "", 600, 4, clientId, clientSecret);
    if (response.success === false) {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 400,
          status: "error",
          msg: "Failed to generate OTP❗️",
        })
      );
    } else {
      const otpid = response.orderId;
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 200,
          status: "success",
          data: {
            phoneno: phoneno,
            otpid: otpid,
          },
          msg: "Otp sent on this number successfully🚀",
        })
      );
    }
  } catch (error) {
    console.log(error);
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 500,
        msg: "internal server error",
      })
    );
  }
};

exports.varifyLoginOTP = async (req, res, next) => {
  const { error } = verifyLoginOtpSchema.validate(req.body);
  if (error) {
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 400,
        msg: error.details[0].message
      })
    );
  }
  try {
    const { phoneno, otpid, enteredotp } = req.body;
    const [userResults] = await findUser(phoneno);
    const user = userResults[0];
    const phonewithcountrycode = "+91" + phoneno;
    const varificationresponse = await otpless.verifyOTP("", phonewithcountrycode, otpid, enteredotp, clientId, clientSecret);
    if (varificationresponse.success === false) {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 404,
          status: "error",
          msg: varificationresponse.errorMessage,
        })
      );
    }
    if (varificationresponse.isOTPVerified === true) {
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 200,
          status: "success",
          msg: "You're loggedin successfully🥳",
          data: {
            JWTToken: { accessToken, refreshToken },
          }
        })
      );
    }
    else {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 404,
          status: "error",
          msg: varificationresponse.reason ? varificationresponse.reason : "entered otp is wrong,please try again😓",
        })
      );
    }
  } catch (error) {
    console.log("error while login", error);
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 500,
        msg: "internal server error",
      })
    );
  }
};

exports.refreshAccessToken = async (req, res, next) => {
  const { error } = refreshAccessTokenSchema.validate(req.body);
  if (error) {
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 400,
        msg: error.details[0].message
      })
    );
  }
  try {
    const { refreshToken } = req.body;
    const userId = verifyRefreshToken(refreshToken);
    if (userId === "expired") {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 403,
          status: "error",
          msg: "Refresh token has expired⏳",
        })
      );
    } else if (!userId) {
      return sendHttpResponse(req, res, next,
        generateResponse({
          statusCode: 401,
          status: "error",
          msg: "Invalid refresh token🚨",
        })
      );
    }
    const accessToken = generateAccessToken(userId);
    return sendHttpResponse(req, res, next,
      generateResponse({
        statusCode: 200,
        status: "success",
        msg: "New access token generated successfully🧾",
        data: {
          accessToken,
        },
      })
    );
  } catch (error) {
    console.log("error while refreshing access token", error);
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 500,
        msg: "internal server error",
      })
    );
  }
};

exports.resendOtp = async (req, res, next) => {
  const { error } = resendOtpSchema.validate(req.body);
  if (error) {
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 400,
        msg: error.details[0].message
      })
    );
  }
  try {
    const { otpid } = req.body;
    const response = await otpless.resendOTP(otpid, clientId, clientSecret);
    if (response.success === false) {
      return sendHttpResponse(req, res, next,
        generateResponse({
          status: "error",
          statusCode: 400,
          msg: response.errorMessage,
        })
      );
    }
    const newotpId = response.orderId;
    return sendHttpResponse(req, res, next,
      generateResponse({
        statusCode: 200,
        status: "success",
        data: {
          otpid: newotpId,
        },
        msg: "otp resent successfully✅",
      })
    );
  } catch (error) {
    console.log(error);
    return sendHttpResponse(req, res, next,
      generateResponse({
        status: "error",
        statusCode: 500,
        msg: "internal server error",
      })
    );
  }
};