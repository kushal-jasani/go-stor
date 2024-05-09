const db = require('../util/db');

const getCoupons = async (productId, categoryId) => {
    let sql;
    let params = []
    if (productId) {
        sql = `SELECT c.id
        FROM coupons c
        WHERE c.product_id IS NOT NULL
        AND FIND_IN_SET(?, REPLACE(REPLACE(c.product_id, '[', ''), ']', '')) > 0`
        params.push(productId)
    } else if (categoryId) {
        sql = `SELECT c.id
        FROM coupons c
        WHERE c.product_id IS NULL
        AND FIND_IN_SET(?, REPLACE(REPLACE(c.category_id, '[', ''), ']', '')) > 0`
        params.push(categoryId)
    }

    return await db.query(sql, params)
}

const getApplicableCouponsById = async (couponId) => {
    let sql = `SELECT id, code, description FROM coupons WHERE id IN (?)`

    let params = [couponId]
    return await db.query(sql, params)
}

const getNotApplicableCouponsById = async (couponId) => {
    let sql = `SELECT id, code, description FROM coupons WHERE id NOT IN (?)`

    let params = [couponId]
    return await db.query(sql, params)
}

const getCouponByCouponId = async (couponId) => {
    let sql = `SELECT * FROM coupons WHERE id = ?`

    let params = [couponId]
    return await db.query(sql, params)
}

module.exports = {
    getCoupons,
    getApplicableCouponsById,
    getNotApplicableCouponsById,
    getCouponByCouponId
};