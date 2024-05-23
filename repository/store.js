const db = require('../util/db');

const getStoreList = async (offset, limit) => {
    let sql = `SELECT id, name, state, profile_image FROM store LIMIT ?, ?`

    let params = [offset, limit];
    return await db.query(sql, params);
}

const getStoreCount = async () => {
    let sql = `SELECT DISTINCT id FROM store`
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
            p.product_name,
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
            products p
        LEFT JOIN specifications sp ON p.id = sp.product_id
        WHERE p.store_id = ?`;

    let params = [storeId];
    let conditions = [];
    let conditionCount = 0;

    // Check if other filters are provided
    if (parsedOtherFilter) {
        Object.entries(parsedOtherFilter).forEach(([key, values]) => {
            if (Array.isArray(values) && values.length > 0) {
                conditions.push(`(sp.key = ? AND sp.value IN (${values.map(() => '?').join(', ')}))`);
                params.push(key, ...values);
                conditionCount++;
            }
        });

        if (conditions.length > 0) {
            sql += ` AND (${conditions.join(' OR ')})`;
        }
    }

    // Add price filter conditions in WHERE clause
    if (parsedPriceFilter && parsedPriceFilter.minPrice !== undefined && parsedPriceFilter.maxPrice !== undefined) {
        sql += ` AND p.selling_price BETWEEN ? AND ?`;
        params.push(parsedPriceFilter.minPrice, parsedPriceFilter.maxPrice);
    }

    // Group by all non-aggregated columns
    sql += ` GROUP BY
                p.id,
                p.product_name,
                p.MRP,
                p.selling_price`;

    // Add having clause if there are filter conditions
    if (conditionCount > 0) {
        sql += ` HAVING COUNT(DISTINCT CASE WHEN sp.key IN (${Object.keys(parsedOtherFilter).map(() => '?').join(', ')}) THEN sp.key ELSE NULL END) = ?`;
        params.push(...Object.keys(parsedOtherFilter), conditionCount);
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

const getProductCountByStoreId = async (storeId, parsedPriceFilter, parsedOtherFilter) => {
    let sql = `SELECT DISTINCT
            p.id AS product_id,
            p.selling_price AS product_selling_price,
            CAST((p.MRP - p.selling_price) AS UNSIGNED) AS discount_amount,
            CONCAT(FORMAT(((p.MRP - p.selling_price) / p.MRP) * 100, 0), '%') AS discount_percentage
        FROM
            products p
        LEFT JOIN specifications sp ON p.id = sp.product_id
        WHERE p.store_id = ?`;

    let params = [storeId];
    let conditions = [];
    let conditionCount = 0;

    // Check if other filters are provided
    if (parsedOtherFilter) {
        Object.entries(parsedOtherFilter).forEach(([key, values]) => {
            if (Array.isArray(values) && values.length > 0) {
                conditions.push(`(sp.key = ? AND sp.value IN (${values.map(() => '?').join(', ')}))`);
                params.push(key, ...values);
                conditionCount++;
            }
        });

        if (conditions.length > 0) {
            sql += ` AND (${conditions.join(' OR ')})`;
        }
    }

    // Add price filter conditions in WHERE clause
    if (parsedPriceFilter && parsedPriceFilter.minPrice !== undefined && parsedPriceFilter.maxPrice !== undefined) {
        sql += ` AND p.selling_price BETWEEN ? AND ?`;
        params.push(parsedPriceFilter.minPrice, parsedPriceFilter.maxPrice);
    }

    // Group by all non-aggregated columns
    sql += ` GROUP BY
                p.id,
                p.product_name,
                p.MRP,
                p.selling_price`;

    // Add having clause if there are filter conditions
    if (conditionCount > 0) {
        sql += ` HAVING COUNT(DISTINCT CASE WHEN sp.key IN (${Object.keys(parsedOtherFilter).map(() => '?').join(', ')}) THEN sp.key ELSE NULL END) = ?`;
        params.push(...Object.keys(parsedOtherFilter), conditionCount);
    }

    return await db.query(sql, params);
}

module.exports = {
    getStoreList,
    getStoreCount,
    getStoreDetailByStoreId,
    getProductsByStoreId,
    getProductCountByStoreId
};