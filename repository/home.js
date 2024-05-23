const db = require('../util/db');

const getBanner = async () => {
    let sql = `SELECT
            b.id AS banner_id,
            b.title,
            b.banner_type,
            b.image AS banner_image,
            b.horizontal_priority,
            b.vertical_priority
        FROM
            banner b`

    return await db.query(sql)
}

const getBannerDetail = async (bannerId) => {
    let sql = `SELECT * FROM bannerDescription WHERE banner_id = ?`

    let params = [bannerId]
    return await db.query(sql, params)
}

const getBannerProducts = async ({ categoryId, subCategoryId, bannerDiscount, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit }) => {
    const bannerDiscount1 = parseFloat(bannerDiscount.replace('%', ''));
    const categoryIdList = categoryId ? JSON.parse(categoryId) : [];
    const subCategoryIdList = subCategoryId ? JSON.parse(subCategoryId) : [];

    let params = [];
    let conditions = [];

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
            products p`

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

    // Add WHERE clause
    sql += ` WHERE (`;
    if (categoryIdList.length > 0) {
        conditions.push(`p.category_id IN (?)`);
        params.push(categoryIdList);
    }

    if (subCategoryIdList.length > 0) {
        conditions.push(`p.subcategory_id IN (?)`);
        params.push(subCategoryIdList);
    }

    if (conditions.length > 0) {
        sql += conditions.join(' OR ');
    } else {
        sql += '1 = 1'; // Default condition to avoid SQL syntax error
    }

    if (bannerDiscount1) {
        sql += `) AND ((((p.MRP - p.selling_price) / p.MRP) * 100) <= ?)`;
        params.push(bannerDiscount1);
    }

    // Add price filter conditions
    if (parsedPriceFilter && parsedPriceFilter.minPrice !== undefined && parsedPriceFilter.maxPrice !== undefined) {
        sql += ` AND (p.selling_price BETWEEN ? AND ?)`;
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
            sql += ` ORDER BY (((p.MRP - p.selling_price) / p.MRP) * 100) DESC`;
        // No sorting specified or invalid sorting type, leave it unsorted
    }

    // Add LIMIT and OFFSET
    sql += ` LIMIT ?, ?`
    params.push(offset, limit);

    return await db.query(sql, params);
};

const getBannerProductCount = async ({ categoryId, subCategoryId, bannerDiscount, parsedPriceFilter, parsedOtherFilter, sortBy }) => {
    const bannerDiscount1 = parseFloat(bannerDiscount.replace('%', ''));
    const categoryIdList = categoryId ? JSON.parse(categoryId) : [];
    const subCategoryIdList = subCategoryId ? JSON.parse(subCategoryId) : [];

    let params = [];
    let conditions = [];

    let sql = `SELECT DISTINCT
            p.id AS product_id,
            p.MRP AS product_MRP,
            p.selling_price AS product_selling_price,
            CAST((p.MRP - p.selling_price) AS UNSIGNED) AS discount_amount,
            CONCAT(FORMAT(((p.MRP - p.selling_price) / p.MRP) * 100, 0), '%') AS discount_percentage
        FROM
            products p`

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

    // Add WHERE clause
    sql += ` WHERE (`;
    if (categoryIdList.length > 0) {
        conditions.push(`p.category_id IN (?)`);
        params.push(categoryIdList);
    }

    if (subCategoryIdList.length > 0) {
        conditions.push(`p.subcategory_id IN (?)`);
        params.push(subCategoryIdList);
    }

    if (conditions.length > 0) {
        sql += conditions.join(' OR ');
    } else {
        sql += '1 = 1'; // Default condition to avoid SQL syntax error
    }

    if (bannerDiscount1) {
        sql += `) AND ((((p.MRP - p.selling_price) / p.MRP) * 100) <= ?)`;
        params.push(bannerDiscount1);
    }

    // Add price filter conditions
    if (parsedPriceFilter && parsedPriceFilter.minPrice !== undefined && parsedPriceFilter.maxPrice !== undefined) {
        sql += ` AND (p.selling_price BETWEEN ? AND ?)`;
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
            sql += ` ORDER BY (((p.MRP - p.selling_price) / p.MRP) * 100) DESC`;
        // No sorting specified or invalid sorting type, leave it unsorted
    }

    return await db.query(sql, params);
};

const getTopProductsByCategoryId = async (categoryIds) => {
    let sql = `SELECT DISTINCT
            oi.product_id AS product_id,
            p.product_name,
            p.category_id,
            c.name AS category_name,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            p.MRP AS product_MRP,
            p.selling_price AS product_selling_price,
            CAST((p.MRP - p.selling_price) AS UNSIGNED) AS discount_amount,
            CONCAT(FORMAT(((p.MRP - p.selling_price) / p.MRP) * 100, 0), '%') AS discount_percentage,
            (
                SELECT COUNT(*)
                FROM orderItems oi2
                WHERE oi2.product_id = p.id
            ) AS total_count
        FROM
            orderItems oi
        JOIN
            products p ON oi.product_id = p.id
        JOIN
            category c ON p.category_id = c.id
        WHERE
            p.category_id IN (?)
        ORDER BY
            total_count DESC`

    let params = [categoryIds];
    return await db.query(sql, params);
};

module.exports = {
    getBanner,
    getBannerDetail,
    getBannerProducts,
    getBannerProductCount,
    getTopProductsByCategoryId
};