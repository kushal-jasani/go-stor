const Joi = require("joi");

const addressSchema = Joi.object({
    name: Joi.string().required(),
    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    address: Joi.string().required(),
    pinCode: Joi.string().pattern(/^[0-9]{6}$/).required()
});

const productSchema = Joi.object({
    id: Joi.number().integer().min(1).required(),
    quantity: Joi.number().integer().min(1).max(5).required()
});

const productsSchema = Joi.array().items(productSchema);

module.exports = {
    addressSchema,
    productsSchema
}