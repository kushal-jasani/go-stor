const {
    getCurrentOrders,
    getPastOrders,
    getOrderByOrderId,
    addOrderDetail,
    addOrderItemDetail,
    addPaymentDetail,
    getPaymentDetails,
    updateOrderStatus,
    updatePaymentDetails,
    getOrderCount
} = require('../repository/order');

const {
    getCouponByCouponId
} = require('../repository/coupons');

const {
    getProductByProductId
} = require('../repository/products');

const {
    getAddress,
    insertOrderAddress,
    getUserIdByAddress
} = require('../repository/address');

const {
    productsSchema
} = require("../helper/order_validation_schema");

const uuid = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const { generateResponse, sendHttpResponse } = require("../helper/response");

function generateInvoiceNumber() {
    return uuid.v4(); // Generates a version 4 UUID
}

const isApplicable = async (couponId, order_total, orderCount) => {
    const [couponDetail] = await getCouponByCouponId(couponId)
    const { min_price, valid_on_order_number, start_date, expiry_date } = couponDetail[0]

    const currentDate = new Date();
    if (!(currentDate >= start_date && currentDate <= expiry_date)) {
        return 0
    }
    if (order_total < min_price) {
        return 0
    }
    if (orderCount > valid_on_order_number) {
        return 0
    }
    return 1
}

exports.getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const [currentOrders] = await getCurrentOrders({ userId: req.user.userId, offset, limit })
        if (!currentOrders.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Orders found.',
                })
            );
        }

        const [pastOrders] = await getPastOrders({ userId: req.user.userId, offset, limit })
        if (!pastOrders.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Orders found.',
                })
            );
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Orders fetched!',
                data: {
                    currentOrders,
                    pastOrders
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getOrderByOrderId = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const [order] = await getOrderByOrderId({ userId: req.user.userId, orderId })
        if (!order.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'Order Detail not found!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order Detail fetched!',
                data: order
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getOrderSummary = async (req, res, next) => {
    try {
        const { products, couponId } = req.query;

        let parsedProducts;
        try {
            parsedProducts = JSON.parse(products);
        } catch (error) {
            console.error('Error parsing filters: ', error);
        }

        let order_sub_total = 0, item_count = 0;
        await Promise.all(
            parsedProducts.map(async (product) => {
                const [productDetail] = await getProductByProductId(product.id)

                item_count += 1;
                order_sub_total += parseFloat(productDetail[0].product_selling_price) * parseFloat(product.quantity)
            })
        );
        order_sub_total = order_sub_total.toFixed(2);

        let deliveryCharge = order_sub_total > 5999 ? 'FREE' : (order_sub_total * 0.02).toFixed(2)
        let discountAmount = 0;
        if (couponId) {
            const [coupon] = await getCouponByCouponId(couponId);
            if (!coupon.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "Coupon not found!",
                    })
                );
            }
            const { discount_type, discount_value, max_discount } = coupon[0]; let [orderCount] = await getOrderCount({ user_id: req.user.userId })
            let is_valid = await isApplicable(couponId, order_sub_total, orderCount)
            if (!is_valid) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "COUPON IS NOT APPLICABLE, PLEASE REFER TO THE TERMS AND CONDITIONS FOR MORE DETAILS.",
                    })
                );
            }

            if (discount_type === 'fixed') {
                discountAmount = discount_value
            } else if (discount_type === 'rate') {
                const rated_discount = (order_sub_total * discount_value) / 100
                discountAmount = rated_discount > max_discount ? max_discount : rated_discount
            }
        }

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
        const { addressId, couponId, products } = req.body;

        // validate addressId
        const [userData] = await getUserIdByAddress({ id: addressId })
        if (!userData.length || userData[0].user_id !== req.user.userId) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: `Invalid addressId for current user.`
                })
            );
        }

        if (!products || !products.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: `For checkout one product required in cart.`
                })
            );
        }
        const { error } = productsSchema.validate(products);
        if (error) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: error.details[0].message
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
        if (couponId) {
            const [coupon] = await getCouponByCouponId(couponId);
            if (!coupon.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "Coupon not found!",
                    })
                );
            }
            const { discount_type, discount_value, max_discount } = coupon[0]; let [orderCount] = await getOrderCount({ user_id: req.user.userId })
            let is_valid = await isApplicable(couponId, order_sub_total, orderCount)
            if (!is_valid) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "COUPON IS NOT APPLICABLE, PLEASE REFER TO THE TERMS AND CONDITIONS FOR MORE DETAILS.",
                    })
                );
            }

            if (discount_type === 'fixed') {
                discountAmount = discount_value
            } else if (discount_type === 'rate') {
                const rated_discount = (order_sub_total * discount_value) / 100
                discountAmount = rated_discount > max_discount ? max_discount : rated_discount
            }
        }

        let order_total = (parseFloat(order_sub_total) + parseFloat(deliveryCharge) - parseFloat(discountAmount)).toFixed(2);

        // add orderAddress details in database
        const [addressDetail] = await getAddress({ user_id: req.user.userId, id: addressId })
        const [addOrderAddress] = await insertOrderAddress(addressDetail[0])
        let order_address_id = addOrderAddress.insertId

        // add order in database
        const [order] = await addOrderDetail({ user_id: req.user.userId, coupon_id: couponId, address_id: order_address_id, gross_amount: order_sub_total, discount_amount: discountAmount, delivery_charge: deliveryCharge, order_amount: order_total, status: 'pending' })
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

        let paymentIntent;
        const amountInPaisa = Math.round(order_total * 100);
        const paymentIntentData = {
            payment_method_types: ['card'],
            amount: amountInPaisa,
            currency: 'usd',
            description: 'Order payment',
            metadata: { orderId },
            // shipping: {
            //     name: addressDetail[0].name,
            //     address: {
            //         line1: addressDetail[0].address,
            //         line2: 'Address Line 2',
            //         city: 'Surat',
            //         postal_code: addressDetail[0].pin_code,
            //         state: 'Gujarat',
            //         country: 'IN',
            //     }
            // }
        };
        paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
        console.log(paymentIntent)

        // update payment status in database
        const [paymentDetail] = await addPaymentDetail({ order_id: orderId, status: 'unpaid' });
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
                    order_id: orderId,
                    paymentIntent_id: paymentIntent ? paymentIntent.id : null,
                    paymentIntent_client_secret: paymentIntent ? paymentIntent.client_secret : null
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

exports.stripeWebhook = async (req, res, next) => {
    const payload = JSON.stringify(req.body);
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_END_POINT_SECRET;
    let event, orderId, invoiceNumber, paymentDetail;
    try {
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;
                orderId = paymentIntentSucceeded.metadata.orderId;

                [paymentDetail] = await getPaymentDetails(orderId);
                invoiceNumber = paymentDetail[0].invoice_number
                if (paymentDetail[0].status !== paymentIntentSucceeded.status) {
                    invoiceNumber = generateInvoiceNumber();
                }

                // Update order table status & the payment details table with the payment status
                await updateOrderStatus(orderId, 'placed');
                await updatePaymentDetails(orderId, invoiceNumber, paymentIntentSucceeded.payment_method_types[0], paymentIntentSucceeded.status);
                break;

            case 'payment_intent.canceled':
                const paymentIntentCanceled = event.data.object;
                // Then define and call a function to handle the event payment_intent.canceled
                break;

            case 'payment_intent.created':
                const paymentIntentCreated = event.data.object;
                // Then define and call a function to handle the event payment_intent.created
                break;

            case 'payment_intent.payment_failed':
                const paymentIntentPaymentFailed = event.data.object;
                orderId = paymentIntentPaymentFailed.metadata.orderId;

                [paymentDetail] = await getPaymentDetails(orderId);
                invoiceNumber = paymentDetail[0].invoice_number
                if (paymentDetail[0].status !== paymentIntentSucceeded.status) {
                    invoiceNumber = generateInvoiceNumber();
                }

                // Update order table status & the payment details table with the payment status
                await updateOrderStatus(orderId, 'cancel');
                await updatePaymentDetails(orderId, invoiceNumber, paymentIntentPaymentFailed.payment_method_types[0], paymentIntentPaymentFailed.status);
                break;

            case 'payment_intent.processing':
                const paymentIntentProcessing = event.data.object;
                // Then define and call a function to handle the event payment_intent.processing
                break;

            case 'payment_intent.requires_action':
                const paymentIntentRequiresAction = event.data.object;
                // Then define and call a function to handle the event payment_intent.requires_action
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}