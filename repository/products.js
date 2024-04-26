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

const getProductByProductId = async (productId) => {
    let sql = `SELECT
            p.id AS product_id,
            p.product_name AS product_name,
            p.MRP AS product_MRP,
            p.selling_price AS product_selling_price,
            (
                SELECT JSON_ARRAYAGG(i.image) 
                FROM images i
                WHERE i.product_id = p.id
            ) AS images,
            s.name AS Sold_By,
            (
                SELECT JSON_ARRAYAGG(h.description)
                FROM highlights h
                WHERE h.product_id = p.id
            ) AS highlights,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('key', s.key, 'value', s.value))
                FROM specifications s
                WHERE s.product_id = p.id
            ) AS specifications,
            p.warranty AS Warranty_summary
        FROM products p
        JOIN store s ON p.store_id = s.id
        WHERE p.id = ?`

    let params = [productId]
    return await db.query(sql, params);
}

module.exports = {
    getCategoryList,
    getSubCategoryList,
    getProductByCategoryId,
    getProductBySubCategoryId,
    getProductByProductId
};