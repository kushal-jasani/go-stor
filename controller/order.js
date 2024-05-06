const {
    getProductByProductId
} = require('../repository/products');

const stripe = require('stripe')(process.env.STRIPE_KEY);
const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getOrderSummary = async (req, res, next) => {
    try {
        const { products } = req.body;

        let order_sub_total = 0, item_count = 0;
        await Promise.all(
            products.map(async (product) => {
                const [productDetail] = await getProductByProductId(product.id)

                item_count += 1;
                order_sub_total += parseFloat(productDetail[0].product_selling_price) * parseFloat(product.quantity)
            })
        );
        order_sub_total = order_sub_total.toFixed(2);

        let deliveryCharge = order_sub_total > 5999 ? 'FREE' : (order_sub_total * 0.02).toFixed(2)
        let order_total = (parseFloat(order_sub_total) + (deliveryCharge === 'FREE' ? 0 : parseFloat(deliveryCharge))).toFixed(2);

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order summary fetched!',
                data: {
                    item_count,
                    shipping_charges: deliveryCharge,
                    order_total
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.postOrder = async (req, res, next) => {
    try {
        const { address_id, products } = req.body;

        let order_details = [];
        await Promise.all(
            products.map(async (product) => {
                const [productDetail] = await getProductByProductId(product.id)

                let order_detail = {
                    product_id: product.id,
                    product_name: productDetail[0].product_name,
                    product_selling_price: productDetail[0].product_selling_price,
                    image: productDetail[0].images[0],
                    quantity: product.quantity
                }
                order_details.push(order_detail)
            })
        );
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: order_details.map(product => {
                return {
                    price_data: {
                        currency: 'inr',
                        unit_amount: product.product_selling_price * 100,
                        product_data: {
                            name: product.product_name,
                            images: [product.image]
                        },
                    },
                    quantity: product.quantity,
                }
            }),
            metadata: { stripe_public_key: "pk_test_51OtpDySFzAljgqh0jL1bAOJvq5AJY5DrBpYBApU1pgCEC7Dfh04icMpLT2MgbGs3iA842eWlSq0xHyqtQwbtTQqQ003jRpIWpE"},
            mode: 'payment',
            success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // https://localhost:3000/checkout/success
            cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
        });
        console.log(session)
        let sessionId = session.id

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order summary fetched!',
                data: {
                    sessionId
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}