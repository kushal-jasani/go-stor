const db = require('../util/db');

const getCurrentOrders = async ({ userId, currentOrderOffset, currentOrderLimit }) => {
    let sql = `SELECT
            o.id AS order_number,
            o.order_amount AS total_amount,
            o.status AS order_status,
            (
                SELECT SUM(oi.quantity)
                FROM orderItems oi
                WHERE oi.order_id = o.id
            ) AS total_quantity
        FROM
            orders o
        WHERE
            o.user_id = ? AND o.status IN ('placed', 'packed', 'shipped')
        ORDER BY
            o.createdAt DESC
        LIMIT ?, ?`

    let params = [userId, currentOrderOffset, currentOrderLimit]
    return await db.query(sql, params)
}

const getCurrentOrderCount = async ({ userId }) => {
    let sql = `SELECT DISTINCT
            o.id AS order_number
        FROM
            orders o
        WHERE
            o.user_id = ? AND o.status IN ('placed', 'packed', 'shipped')`

    let params = [userId]
    return await db.query(sql, params)
}

const getPastOrders = async ({ userId, pastOrderOffset, pastOrderLimit }) => {
    let sql = `SELECT
            o.id AS order_number,
            o.order_amount AS total_amount,
            o.status AS order_status,
            (
                SELECT SUM(oi.quantity)
                FROM orderItems oi
                WHERE oi.order_id = o.id
            ) AS total_quantity
        FROM
            orders o
        WHERE
            o.user_id = ? AND o.status IN ('delivered', 'cancel')
        ORDER BY
            o.createdAt DESC
        LIMIT ?, ?`

    let params = [userId, pastOrderOffset, pastOrderLimit]
    return await db.query(sql, params)
}

const getPastOrderCount = async ({ userId }) => {
    let sql = `SELECT DISTINCT
            o.id AS order_number
        FROM
            orders o
        WHERE
            o.user_id = ? AND o.status IN ('delivered', 'cancel')`

    let params = [userId]
    return await db.query(sql, params)
}

const getOrderByOrderId = async ({ userId, orderId }) => {
    let sql = `SELECT
            o.createdAt AS Order_date,
            o.id AS order_number,
            o.status AS order_status,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'product_id', oi.product_id,
                        'product_name', p.product_name,
                        'product_image', (
                            SELECT image
                            FROM images
                            WHERE product_id = p.id
                            ORDER BY id ASC
                            LIMIT 1
                        ),
                        'quantity', oi.quantity,
                        'order_price', oi.price
                    )
                )
                FROM orderItems oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = o.id
            ) AS Product_details,
            (
                SELECT JSON_OBJECT('name', a.name, 'mobile_number', a.mobile_number, 'email', a.email, 'address', a.address, 'pin_code', a.pin_code)
                FROM orderAddress a
                WHERE o.address_id = a.id
            ) AS delivery_address,
            (
                SELECT JSON_OBJECT(
                    'invoice_number', p.invoice_number,
                    'type', p.type,
                    'total_quantity', (SELECT SUM(oi.quantity) FROM orderItems oi WHERE oi.order_id = o.id),
                    'gross_amount', ROUND(o.gross_amount, 2),
                    'discount_amount', ROUND(o.discount_amount, 2),
                    'delivery_charge', ROUND(o.delivery_charge, 2),
                    'order_amount', ROUND(o.order_amount, 2)
                )
            ) AS payment_details
        FROM
            orders o
        JOIN
            paymentDetails p ON o.id = p.order_id
        WHERE
            o.user_id = ? AND o.id = ? AND o.status IN ('placed', 'packed', 'shipped', 'delivered', 'cancel')`

    let params = [userId, orderId]
    return await db.query(sql, params)
}

const getOrderCount = async ({ user_id }) => {
    let sql = `SELECT count(*) FROM orders WHERE ?`

    let params = [user_id]
    return await db.query(sql, params)
}

const addOrderDetail = async ({ user_id, coupon_id, address_id, gross_amount, discount_amount, delivery_charge, referral_bonus_used, order_amount, status }) => {
    let sql = `INSERT INTO orders SET ?`

    let params = { user_id, coupon_id, address_id, gross_amount, discount_amount, delivery_charge, referral_bonus_used, order_amount, status }
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
    let sql = `SELECT
            p.*,
            o.user_id
        FROM paymentDetails p
        JOIN orders o ON o.id = p.order_id
        WHERE order_id = ?`

    let params = [order_id]
    return await db.query(sql, params)
}

const countOrdersByUserId = async (userId) => {
    let sql = `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`
    let params = [userId]
    return await db.query(sql, params);
};

const updateOrderStatus = async (orderId, status) => {
    let sql = `UPDATE orders SET status = ? WHERE id = ?`

    let params = [status, orderId]
    return await db.query(sql, params)
}

const updatePaymentDetails = async (orderId, invoiceNumber, type, status) => {
    let sql = `UPDATE paymentDetails SET invoice_number = ?, type = ?, status = ? WHERE order_id = ?`

    let params = [invoiceNumber, type, status, orderId]
    return await db.query(sql, params)
}

const findUserById = async (userId) => {
    let sql = `SELECT id, referral_with FROM users WHERE id = ?`
    let params = [userId]
    return await db.query(sql, params);
};

const findReferralByCode = async (code) => {
    const sql = `SELECT * FROM referral WHERE code = ?`
    let params = [code]
    return await db.query(sql, params);
};

const updateReferralBonus = async (userId, amount) => {
    let sql = `UPDATE referral SET successful_invite = successful_invite + 1, remaining_reward = remaining_reward + ? WHERE user_id = ?`
    let params = [amount, userId]
    return await db.query(sql, params);
};

const getReferralAmount = async (userId) => {
    let sql = `SELECT remaining_reward FROM referral WHERE user_id = ?`
    let params = [userId]
    return await db.query(sql, params);
};

const deductReferralAmount = async (userId, usedAmt) => {
    let sql = `UPDATE referrals SET remaining_reward = remaining_reward - ? WHERE user_id = ?`
    let params = [usedAmt, userId]
    return await db.query(sql, params);
};

module.exports = {
    getCurrentOrders,
    getCurrentOrderCount,
    getPastOrders,
    getPastOrderCount,
    getOrderByOrderId,
    getOrderCount,
    addOrderDetail,
    addOrderItemDetail,
    addPaymentDetail,
    getPaymentDetails,
    countOrdersByUserId,
    updateOrderStatus,
    updatePaymentDetails,
    findUserById,
    findReferralByCode,
    updateReferralBonus,
    getReferralAmount,
    deductReferralAmount
};