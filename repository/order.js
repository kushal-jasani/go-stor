const db = require('../util/db');

const getOrderCount = async ({ user_id }) => {
    let sql = `SELECT count(*) FROM orders WHERE ?`

    let params = [user_id]
    return await db.query(sql, params)
}

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

const getPaymentDetails = async (order_id) => {
    let sql = `SELECT * FROM paymentDetails WHERE order_id = ?`

    let params = [order_id]
    return await db.query(sql, params)
}

const updatePaymentDetails = async (orderId, invoiceNumber, type, status) => {
    let sql = `UPDATE paymentDetails SET invoice_number = ?, type = ?, status = ? WHERE order_id = ?`

    let params = [invoiceNumber, type, status, orderId]
    return await db.query(sql, params)
}

module.exports = {
    getOrderCount,
    addOrderDetail,
    addOrderItemDetail,
    addPaymentDetail,
    getPaymentDetails,
    updatePaymentDetails
};