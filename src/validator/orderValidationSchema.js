const Joi = require("joi");

const addressSchema = Joi.object({
    name: Joi.string().required(),
    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    address: Joi.string().required(),
    pinCode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    city: Joi.string().required(),
    state: Joi.string().required()
});

const productSchema = Joi.object({
    id: Joi.number().integer().min(1).required(),
    quantity: Joi.number().integer().min(1).max(5).required()
});

const orderSchema = Joi.object({
    addressId: Joi.number().required(),
    couponId: Joi.number().optional(),
    products: Joi.array().items(productSchema).min(1).required(),
    use_referral_bonus: Joi.boolean().required(),
})

module.exports = {
    addressSchema,
    orderSchema
}