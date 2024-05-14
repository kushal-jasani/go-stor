const Joi = require("joi");

const productSchema = Joi.object({
    id: Joi.number().integer().min(1).required(),
    quantity: Joi.number().integer().min(1).max(5).required()
});

const productsSchema = Joi.array().items(productSchema);

module.exports = {
    productsSchema
}