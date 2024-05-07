const db = require('../util/db');

const addOrderDetail = async ({ user_id, coupon_id, address_id, gross_amount, discount_amount, delivery_charge, order_amount }) => {
    let sql = `INSERT INTO orders SET ?`

    let params = { user_id, coupon_id, address_id, gross_amount, discount_amount, delivery_charge, order_amount }
    return await db.query(sql, params)
}

const addOrderItemDetail = async ({ order_id, product_id, quantity, price }) => {
    let sql = `INSERT INTO orderItems SET ?`

    let params = { order_id, product_id, quantity, price }
    return await db.query(sql, params)
}

const addPaymentDetail = async ({ order_id, status }) => {
    let sql = `INSERT INTO paymentDetails SET ?`

    let params = { order_id, status }
    return await db.query(sql, params)
}

const updatePaymentDetails = async (paymentIntent, status) => {
    let sql = `UPDATE paymentDetails SET status = ? WHERE id = ?`

    let params = [status, paymentId]
    return await db.query(sql, params)
}

module.exports = {
    addOrderDetail,
    addOrderItemDetail,
    addPaymentDetail,
    updatePaymentDetails
};