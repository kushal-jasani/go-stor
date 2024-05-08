const {
    addOrderDetail,
    addOrderItemDetail,
    addPaymentDetail,
    getPaymentDetails,
    updatePaymentDetails
} = require('../repository/order');

const {
    getProductByProductId
} = require('../repository/products');

const {
    getAddress,
    insertOrderAddress,
    getUserIdByAddress
} = require('../repository/address');

const uuid = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const { generateResponse, sendHttpResponse } = require("../helper/response");

function generateInvoiceNumber() {
    return uuid.v4(); // Generates a version 4 UUID
}

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
        let discountAmount = 0;
        let order_total = (parseFloat(order_sub_total) + (deliveryCharge === 'FREE' ? 0 : parseFloat(deliveryCharge)) - parseFloat(discountAmount)).toFixed(2);

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order summary fetched!',
                data: {
                    item_count,
                    order_sub_total,
                    shipping_charges: deliveryCharge,
                    discount_amount: discountAmount,
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

exports.getCheckout = async (req, res, next) => {
    try {
        const { address_id, coupon_id, products } = req.body;

        // validate addressId
        const [userData] = await getUserIdByAddress({ id: address_id })
        if (!userData.length || userData[0].user_id !== req.user.userId) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: `Invalid address_id for current user.`
                })
            );
        }

        let orderItems = [], order_sub_total = 0, item_count = 0;
        await Promise.all(
            products.map(async (product) => {
                const [productDetail] = await getProductByProductId(product.id)

                item_count += 1;
                order_sub_total += parseFloat(productDetail[0].product_selling_price) * parseFloat(product.quantity)

                let orderItem = {
                    product_id: product.id,
                    product_name: productDetail[0].product_name,
                    product_selling_price: productDetail[0].product_selling_price,
                    image: productDetail[0].images[0],
                    quantity: product.quantity
                }
                orderItems.push(orderItem)
            })
        );
        order_sub_total = order_sub_total.toFixed(2);
        let deliveryCharge = order_sub_total > 5999 ? 0 : (order_sub_total * 0.02).toFixed(2)
        let discountAmount = 0;
        let order_total = (parseFloat(order_sub_total) + parseFloat(deliveryCharge) - parseFloat(discountAmount)).toFixed(2);

        // add orderAddress details in database
        const [addressDetail] = await getAddress({ user_id: req.user.userId, id: address_id })
        const [addOrderAddress] = await insertOrderAddress(addressDetail[0])
        let order_address_id = addOrderAddress.insertId

        // add order in database
        const [order] = await addOrderDetail({ user_id: req.user.userId, coupon_id, address_id: order_address_id, gross_amount: order_sub_total, discount_amount: discountAmount, delivery_charge: deliveryCharge, order_amount: order_total })
        if (!order.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Failed to add order detail.',
                })
            );
        }
        const orderId = order.insertId;

        // add order Items in database
        await Promise.all(
            orderItems.map(async (orderItem) => {
                let { product_id, quantity, product_selling_price } = orderItem;
                await addOrderItemDetail({ order_id: orderId, product_id, quantity, price: product_selling_price })
            })
        );

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: orderItems.map(product => {
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
            metadata: {
                stripe_public_key: "pk_test_51OtpDySFzAljgqh0jL1bAOJvq5AJY5DrBpYBApU1pgCEC7Dfh04icMpLT2MgbGs3iA842eWlSq0xHyqtQwbtTQqQ003jRpIWpE",
                orderId
            },
            mode: 'payment',
            success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // https://localhost:3000/checkout/success
            cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
            shipping_address_collection: {
                allowed_countries: ['IN'] // Allow shipping address collection for India
            }
        });
        console.log(session)
        let sessionId = session.id

        // update payment status in database
        const [paymentDetail] = await addPaymentDetail({ order_id: orderId, status: session.payment_status });
        if (!paymentDetail.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Failed to add payment details',
                })
            );
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order checkout proceeded',
                data: {
                    session_id: sessionId,
                    order_id: orderId
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

exports.getCheckoutSuccess = async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const { orderId } = session.metadata;

        if (session.payment_status === 'paid') {
            const [paymentDetail] = await getPaymentDetails(orderId);
            let invoiceNumber;
            invoiceNumber = paymentDetail[0].invoice_number
            if (paymentDetail[0].status !== 'paid') {
                invoiceNumber = generateInvoiceNumber();
            }
            await updatePaymentDetails(orderId, invoiceNumber, session.payment_method_types[0], session.payment_status);
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'Order creation successful.',
                    data: {
                        orderId,
                        invoiceNumber
                    }
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 400,
                msg: "payment status unpaid or not updated"
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

exports.getCheckoutCancel = async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const { orderId } = session.metadata;
        let invoiceNumber;

        const [paymentDetail] = await getPaymentDetails(orderId);
        await updatePaymentDetails(orderId, invoiceNumber, session.payment_method_types[0], session.payment_status);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order canceled!',
                data: {
                    orderId
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