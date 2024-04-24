const db = require('../util/db');

const getCategoryList = async () => {
    let sql = `SELECT id, name, image FROM category`
    return await db.query(sql);
}

const getSubCategoryList = async (categoryId) => {
    let sql = `SELECT
            s.id,
            c.name AS category_name,
            s.name AS subCategory_name
        FROM subCategory s
        JOIN category c ON s.category_id = c.id
        WHERE category_id = ?`

    let params = [categoryId]
    return await db.query(sql, params);
}

const getProductByCategoryId = async (categoryId, offset, limit) => {
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
        WHERE p.category_id = ?
        LIMIT ?, ?`

    let params = [categoryId, offset, limit]
    return await db.query(sql, params);
}

const getProductBySubCategoryId = async (subCategoryId, offset, limit) => {
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
        FROM products p
        WHERE p.subcategory_id = ?
        LIMIT ?, ?`

    let params = [subCategoryId, offset, limit]
    return await db.query(sql, params);
}

module.exports = {
    getCategoryList,
    getSubCategoryList,
    getProductByCategoryId,
    getProductBySubCategoryId
};