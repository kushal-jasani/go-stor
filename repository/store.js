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

const getProductsByStoreId = async (storeId, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit) => {
    let sql = `SELECT DISTINCT
            p.id AS product_id,
            p.product_name AS product_name,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            p.MRP AS product_MRP,
            p.selling_price AS product_selling_price,
            CAST((p.MRP - p.selling_price) AS UNSIGNED) AS discount_amount,
            CONCAT(FORMAT(((p.MRP - p.selling_price) / p.MRP) * 100, 0), '%') AS discount_percentage
        FROM
            products p`
    let params = [];

    // Check if other filters are provided
    if (parsedOtherFilter) {
        let joinConditions = [];
        let joinParams = [];

        Object.entries(parsedOtherFilter).forEach(([key, values]) => {
            // Ensure values is an array
            if (!Array.isArray(values)) return;

            if (values.length) {
                // Construct the JOIN conditions
                joinConditions.push(`(sp.key = ? AND sp.value IN (${values.map(() => '?').join(', ')}))`);
                joinParams.push(key, ...values);
            }
        });

        // Add the JOIN clause
        if (joinConditions.length > 0) {
            sql += ` INNER JOIN specifications sp ON p.id = sp.product_id AND (${joinConditions.join(' OR ')})`;
            params.push(...joinParams);
        }
    }

    // Add WHERE clause for store filter
    sql += ` WHERE p.store_id = ?`;
    params.push(storeId);

    // Add price filter conditions
    if (parsedPriceFilter && parsedPriceFilter.minPrice !== undefined && parsedPriceFilter.maxPrice !== undefined) {
        sql += ` AND p.selling_price BETWEEN ? AND ?`;
        params.push(parsedPriceFilter.minPrice, parsedPriceFilter.maxPrice);
    }

    // Add sorting
    switch (sortBy) {
        case 'discount_percentage':
            sql += ` ORDER BY discount_percentage DESC`;
            break;
        case 'selling_price_desc':
            sql += ` ORDER BY p.selling_price DESC`;
            break;
        case 'selling_price_asc':
            sql += ` ORDER BY p.selling_price ASC`;
            break;
        default:
        // No sorting specified or invalid sorting type, leave it unsorted
    }

    // Add LIMIT and OFFSET
    sql += ` LIMIT ?, ?`;
    params.push(offset, limit);

    return await db.query(sql, params);
}

const getProductCountByStoreId = async (storeId, parsedPriceFilter, parsedOtherFilter, sortBy) => {
    let sql = `SELECT DISTINCT
            p.id AS product_id,
            p.selling_price AS product_selling_price,
            CAST((p.MRP - p.selling_price) AS UNSIGNED) AS discount_amount,
            CONCAT(FORMAT(((p.MRP - p.selling_price) / p.MRP) * 100, 0), '%') AS discount_percentage
        FROM
            products p`
    let params = [];

    // Check if other filters are provided
    if (parsedOtherFilter) {
        let joinConditions = [];
        let joinParams = [];

        Object.entries(parsedOtherFilter).forEach(([key, values]) => {
            // Ensure values is an array
            if (!Array.isArray(values)) return;

            if (values.length) {
                // Construct the JOIN conditions
                joinConditions.push(`(sp.key = ? AND sp.value IN (${values.map(() => '?').join(', ')}))`);
                joinParams.push(key, ...values);
            }
        });

        // Add the JOIN clause
        if (joinConditions.length > 0) {
            sql += ` INNER JOIN specifications sp ON p.id = sp.product_id AND (${joinConditions.join(' OR ')})`;
            params.push(...joinParams);
        }
    }

    // Add WHERE clause for store filter
    sql += ` WHERE p.store_id = ?`;
    params.push(storeId);

    // Add price filter conditions
    if (parsedPriceFilter && parsedPriceFilter.minPrice !== undefined && parsedPriceFilter.maxPrice !== undefined) {
        sql += ` AND p.selling_price BETWEEN ? AND ?`;
        params.push(parsedPriceFilter.minPrice, parsedPriceFilter.maxPrice);
    }

    // Add sorting
    switch (sortBy) {
        case 'discount_percentage':
            sql += ` ORDER BY discount_percentage DESC`;
            break;
        case 'selling_price_desc':
            sql += ` ORDER BY p.selling_price DESC`;
            break;
        case 'selling_price_asc':
            sql += ` ORDER BY p.selling_price ASC`;
            break;
        default:
        // No sorting specified or invalid sorting type, leave it unsorted
    }

    return await db.query(sql, params);
}

module.exports = {
    getStoreList,
    getStoreDetailByStoreId,
    getProductsByStoreId,
    getProductCountByStoreId
};