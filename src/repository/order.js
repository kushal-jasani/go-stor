const db = require('../util/db');

const getOrderProducts = async ({ userId, offset, limit }) => {
    let sql = `SELECT
            oi.id AS order_item_id,
            p.product_name,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT t.status
                FROM trackOrder t
                WHERE t.order_id = o.id
                ORDER BY t.createdAt DESC
                LIMIT 1
            ) AS order_status,
            o.createdAt AS order_date
        FROM
            orderItems oi
        JOIN
            orders o ON oi.order_id = o.id
        JOIN
            products p ON oi.product_id = p.id
        WHERE
            o.user_id = ? AND (
                (
                    SELECT t.status
                    FROM trackOrder t
                    WHERE t.order_id = o.id
                    ORDER BY t.createdAt DESC
                    LIMIT 1
                ) IN ('Order Placed', 'Order Packed', 'Shipped', 'Out For Delivery', 'Order Delivered', 'Order Cancelled', 'Refund Initiated', 'Refunded')
            )
        ORDER BY
            o.createdAt DESC
        LIMIT ?, ?`

    let params = [userId, offset, limit]
    return await db.query(sql, params)
}

const getOrderProductsCount = async ({ userId }) => {
    let sql = `SELECT
            p.product_name
        FROM
            orderItems oi
        JOIN
                orders o ON oi.order_id = o.id
        JOIN
            products p ON oi.product_id = p.id
        WHERE
            o.user_id = ? AND (
                (
                    SELECT t.status
                    FROM trackOrder t
                    WHERE t.order_id = o.id
                    ORDER BY t.createdAt DESC
                    LIMIT 1
                ) IN ('Order Placed', 'Order Packed', 'Shipped', 'Out For Delivery', 'Order Delivered', 'Order Cancelled', 'Refund Initiated', 'Refunded')
            )
        ORDER BY
            oi.createdAt DESC`

    let params = [userId]
    return await db.query(sql, params)
}

const getOrderByOrderItemId = async ({ userId, orderItemId }) => {
    let sql = `SELECT
            o.id AS order_id,
            o.createdAt AS order_date,
            (
                SELECT JSON_OBJECT(
                    'order_item_id', oi.id,
                    'product_name', p.product_name,
                    'product_quantity', oi.quantity,
                    'images', (
                        SELECT i.image
                        FROM images i
                        WHERE i.product_id = p.id
                        LIMIT 1
                    ),
                    'product_mrp', CAST((p.MRP * oi.quantity) AS UNSIGNED),
                    'product_selling_price', oi.price,
                    'discount_amount', CAST(((p.MRP * oi.quantity) - p.selling_price) AS UNSIGNED),
                    'discount_percentage', CONCAT(FORMAT(100 - ((p.selling_price / (p.MRP * oi.quantity)) * 100), 0), '%'),
                    'order_status', (
                        SELECT t.status
                        FROM trackOrder t
                        WHERE t.order_id = o.id
                        ORDER BY t.createdAt DESC
                        LIMIT 1
                    )
                )
            ) AS product_details,
            (
                SELECT JSON_OBJECT(
                    'is_cancel', oi.is_cancel,
                    'cancel_info', CASE
                        WHEN oi.is_cancel = 1 THEN JSON_OBJECT('cancel_date', oi.updatedAt)
                        ELSE null
                    END,
                    'track', JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'status', t.status,
                            'time', t.createdAt
                        )
                    )
                )
            ) AS track_order,
            (
                SELECT JSON_OBJECT(
                    'price', CAST((p.MRP * oi.quantity) AS UNSIGNED),
                    'item_discount', CAST((p.MRP * oi.quantity) - (p.selling_price * oi.quantity) AS UNSIGNED),
                    'coupon_discount', ROUND(oi.coupon_discount, 2),
                    'shipping_charges', ROUND(oi.delivery_charge, 2),
                    'total_amount', ROUND(
                        (p.MRP * oi.quantity) - ((p.MRP * oi.quantity) - (p.selling_price * oi.quantity)) - oi.coupon_discount + oi.delivery_charge,
                        2
                    )
                )
            ) AS order_summary,
            (
                SELECT JSON_OBJECT(
                    'invoice_number', pd.invoice_number,
                    'type', pd.type,
                    'order_amount', ROUND(
                        (p.MRP * oi.quantity) - ((p.MRP * oi.quantity) - (p.selling_price * oi.quantity)) - oi.coupon_discount + oi.delivery_charge,
                        2
                    )
                )
            ) AS payment_method,
            (
                SELECT JSON_OBJECT('name', a.name, 'mobile_number', a.mobile_number, 'email', a.email, 'address', a.address, 'pin_code', a.pin_code)
                FROM orderAddress a
                WHERE o.address_id = a.id
            ) AS shipping_address
        FROM
            orders o
        JOIN
            orderItems oi ON o.id = oi.order_id
        JOIN
            products p ON oi.product_id = p.id
        JOIN
            paymentDetails pd ON o.id = pd.order_id
        JOIN
            trackOrder t ON o.id = t.order_id
        WHERE
            o.user_id = ? AND oi.id = ? AND (
                (
                    SELECT t.status
                    FROM trackOrder t
                    WHERE t.order_id = o.id
                    ORDER BY t.createdAt DESC
                    LIMIT 1
                ) IN ('Order Placed', 'Order Packed', 'Shipped', 'Out For Delivery', 'Order Delivered', 'Order Cancelled', 'Refund Initiated', 'Refunded')
            )
            GROUP BY pd.invoice_number, pd.type`;

    let params = [userId, orderItemId];
    return await db.query(sql, params);
}

const getOrderCount = async ({ user_id }) => {
    let sql = `SELECT count(*) FROM orders WHERE ?`

    let params = [user_id]
    return await db.query(sql, params)
}

const addOrderDetail = async ({ user_id, coupon_id, address_id, gross_amount, discount_amount, delivery_charge, referral_bonus_used, order_amount }) => {
    let sql = `INSERT INTO orders SET ?`

    let params = { user_id, coupon_id, address_id, gross_amount, discount_amount, delivery_charge, referral_bonus_used, order_amount }
    return await db.query(sql, params)
}

const addOrderItemDetail = async ({ order_id, product_id, quantity, price, coupon_discount, delivery_charge }) => {
    let sql = `INSERT INTO orderItems SET ?`

    let params = { order_id, product_id, quantity, price, coupon_discount, delivery_charge }
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

const updateOrderStatus = async ({ order_id, status }) => {
    let sql = `INSERT INTO trackOrder SET ?`

    let params = { order_id, status }
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
    let sql = `UPDATE referral SET remaining_reward = remaining_reward - ? WHERE user_id = ?`
    let params = [usedAmt, userId]
    return await db.query(sql, params);
};

module.exports = {
    getOrderProducts,
    getOrderProductsCount,
    getOrderByOrderItemId,
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