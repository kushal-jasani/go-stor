const db = require('../util/db');

const getCoupons = async () => {
    let sql = `SELECT id, code, description FROM coupons`

    return await db.query(sql)
}

const getCouponByCouponId = async (couponId) => {
    let sql = `SELECT * FROM coupons WHERE id = ?`

    let params = [couponId]
    return await db.query(sql, params)
}

module.exports = {
    getCoupons,
    getCouponByCouponId
};