const db = require('../util/db');

const getStoreList = async () => {
    let sql = `SELECT id, name, state, profile_image FROM store`
    return await db.query(sql);
}

const getStoreDetailByStoreId = async (storeId) => {
    let sql = `SELECT id, name, state, image FROM store WHERE id = ?`

    let params = [storeId]
    return await db.query(sql, params);
}

const getProductsByStoreId = async (storeId, offset, limit) => {
    let sql = `SELECT
            p.id AS product_id,
            p.product_name AS product_name,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            p.MRP AS product_MRP,
            p.selling_price AS product_selling_price
        FROM
            products p
        WHERE p.store_id = ?
        LIMIT ?, ?`

    let params = [storeId, offset, limit]
    return await db.query(sql, params);
}

module.exports = {
    getStoreList,
    getStoreDetailByStoreId,
    getProductsByStoreId
};