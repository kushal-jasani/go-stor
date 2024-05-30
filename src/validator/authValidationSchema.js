const Joi = require("joi");

const sendOtpSchema = Joi.object({
    phoneno: Joi.string().pattern(/^\d{10}$/).required()
});

const verifyRegisterOtpSchema = Joi.object({
    name: Joi.string().required(),
    phoneno: Joi.string().pattern(/^\d{10}$/).required(),
    email: Joi.string().email().required(),
    referral: Joi.string().optional().allow(null),
    otpid: Joi.string().required(),
    enteredotp: Joi.string().pattern(/^\d{6}$/).required()
});

const verifyLoginOtpSchema = Joi.object({
    phoneno: Joi.string().pattern(/^\d{10}$/).required(),
    otpid: Joi.string().required(),
    enteredotp: Joi.string().pattern(/^\d{6}$/).required()
});

const refreshAccessTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

const resendOtpSchema = Joi.object({
    otpid: Joi.string().required()
});

module.exports = {
    sendOtpSchema,
    verifyRegisterOtpSchema,
    verifyLoginOtpSchema,
    refreshAccessTokenSchema,
    resendOtpSchema
}