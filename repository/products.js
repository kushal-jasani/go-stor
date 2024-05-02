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

const getProductsByCategoryId = async (categoryId, offset, limit) => {
    let sql = `SELECT
            p.id AS product_id,
            p.product_name,
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

const getProductsBySubCategoryId = async (subCategoryId, offset, limit) => {
    let sql = `SELECT
            p.id AS product_id,
            p.product_name,
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

const searchProductList = async (searchText) => {
    let sql = `SELECT DISTINCT
            p.id AS product_id,
            p.product_name,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            p.MRP AS product_MRP,
            p.selling_price AS product_selling_price
        FROM products p
        LEFT JOIN
            subCategory s ON p.subcategory_id = s.id
        JOIN
            category c ON p.category_id = c.id
        LEFT JOIN
            specifications sp ON sp.product_id = p.id
        WHERE
            c.name LIKE ? OR
            s.name LIKE ? OR
            p.product_name LIKE ? OR
            (sp.key = 'brand' AND sp.value LIKE ?)`

    const searchParam = `%${searchText}%`;
    let params = [searchParam, searchParam, searchParam, searchParam]
    return await db.query(sql, params);
}

const filterBySearch = async (productId) => {
    let params = [];
    let sql = `WITH SpecCount AS (
                SELECT
                    sp.key AS spec_key,
                    COUNT(*) AS product_count
                FROM
                    specifications sp
                JOIN
                    products p ON sp.product_id = p.id
                WHERE`
    if (productId) {
        sql += ` p.id IN (?)`
        params.push(productId)
    }
    sql += ` GROUP BY
                    sp.key
            ),
            
            TotalProductCount AS (
                SELECT
                    COUNT(*) AS total_count
                FROM
                    products p
                WHERE`
    if (productId) {
        sql += ` p.id IN (?)`
        params.push(productId)
    }
    sql += ` ),
            
            SpecPercentage AS (
                SELECT
                    spec_key,
                    (product_count / (SELECT total_count FROM TotalProductCount)) * 100 AS percentage
                FROM
                    SpecCount
            ),
            
            FilteredSpec AS (
                SELECT
                    spec_key
                FROM
                    SpecPercentage
                WHERE
                    percentage >= 10
            ),
            
            SpecValues AS (
                SELECT
                    fs.spec_key,
                    JSON_ARRAYAGG(spec_value) AS spec_values
                FROM (
                    SELECT DISTINCT
                        sp.key AS spec_key,
                        sp.value AS spec_value
                    FROM
                        specifications sp
                    JOIN
                        products p ON sp.product_id = p.id
                    WHERE
                        sp.key IN (SELECT spec_key FROM FilteredSpec) AND `
    if (productId) {
        sql += ` p.id IN (?)`
        params.push(productId)
    }
    sql += ` ) AS subquery
                JOIN
                    FilteredSpec fs ON subquery.spec_key = fs.spec_key
                GROUP BY
                    fs.spec_key
            )
            
            SELECT
                spec_key,
                spec_values
            FROM
                SpecValues`

    return await db.query(sql, params);
}

// const getBrandList = async ({ categoryId, subCategoryId }) => {
//     let sql = `SELECT DISTINCT
//             sp.value AS brand
//         FROM specifications sp
//         JOIN
//             products p ON sp.product_id = p.id
//         WHERE
//             sp.key = 'brand'`

//     let params = [];
//     if (categoryId) {
//         sql += ' AND p.category_id = ?';
//         params.push(categoryId);
//     } else if (subCategoryId) {
//         sql += ' AND p.subcategory_id = ?';
//         params.push(subCategoryId);
//     }
//     return await db.query(sql, params);
// }

const getMaxPrice = async ({ categoryId, subCategoryId, productId }) => {
    let sql = `SELECT
            CASE
                WHEN MAX(p.selling_price) < 10000 THEN '10000+'
                ELSE CONCAT(CAST(FLOOR(MAX(p.selling_price) / 10000) * 10000 AS CHAR), '+')
            END AS max_price
        FROM 
            products p`
    if (productId) {
        sql += ` WHERE p.id IN ?`
        params.push(productId);
    }

    let params = [];
    if (categoryId) {
        sql += ' WHERE p.category_id = ?';
        params.push(categoryId);
    } else if (subCategoryId) {
        sql += ' WHERE p.subcategory_id = ?';
        params.push(subCategoryId);
    }
    return await db.query(sql, params);
}

const getOtherFilters = async ({ categoryId, subCategoryId }) => {
    let params = [];
    let sql = `WITH SpecCount AS (
            SELECT
                sp.key AS spec_key,
                COUNT(*) AS product_count
            FROM
                specifications sp
            JOIN
                products p ON sp.product_id = p.id
            WHERE`
    if (categoryId) {
        sql += ` p.category_id = ?`
        params.push(categoryId)
    } else if (subCategoryId) {
        sql += ` p.subcategory_id = ?`
        params.push(subCategoryId)
    }
    sql += ` GROUP BY
                sp.key
        ),
        
        TotalProductCount AS (
            SELECT
                COUNT(*) AS total_count
            FROM
                products p
            WHERE`
    if (categoryId) {
        sql += ` p.category_id = ?`
        params.push(categoryId)
    } else if (subCategoryId) {
        sql += ` p.subcategory_id = ?`
        params.push(subCategoryId)
    }
    sql += ` ),
        
        SpecPercentage AS (
            SELECT
                spec_key,
                (product_count / (SELECT total_count FROM TotalProductCount)) * 100 AS percentage
            FROM
                SpecCount
        ),
        
        FilteredSpec AS (
            SELECT
                spec_key
            FROM
                SpecPercentage
            WHERE
                percentage >= 91
        ),
        
        SpecValues AS (
            SELECT
                fs.spec_key,
                JSON_ARRAYAGG(spec_value) AS spec_values
            FROM (
                SELECT DISTINCT
                    sp.key AS spec_key,
                    sp.value AS spec_value
                FROM
                    specifications sp
                JOIN
                    products p ON sp.product_id = p.id
                WHERE
                    sp.key IN (SELECT spec_key FROM FilteredSpec) AND `
    if (categoryId) {
        sql += ` p.category_id = ?`
        params.push(categoryId)
    } else if (subCategoryId) {
        sql += ` p.subcategory_id = ?`
        params.push(subCategoryId)
    }
    sql += ` ) AS subquery
            JOIN
                FilteredSpec fs ON subquery.spec_key = fs.spec_key
            GROUP BY
                fs.spec_key
        )
        
        SELECT
            spec_key,
            spec_values
        FROM
            SpecValues`

    return await db.query(sql, params);
}

module.exports = {
    getCategoryList,
    getSubCategoryList,
    getProductsByCategoryId,
    getProductsBySubCategoryId,
    getProductByProductId,
    searchProductList,
    filterBySearch,
    // getBrandList,
    getMaxPrice,
    getOtherFilters
};