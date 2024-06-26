const db = require('../util/db');

const getBanner = async () => {
    let sql = `SELECT
            b.id AS banner_id,
            b.title,
            b.banner_type,
            b.image AS banner_image,
            b.horizontal_priority,
            b.vertical_priority,
            b.is_primary,
            b.is_curated
        FROM
            banner b`

    return await db.query(sql)
}

const getBannerByBannerIds = async (bannerIds) => {
    let sql = `SELECT
            b.id AS banner_id,
            b.title,
            b.banner_type,
            b.image AS banner_image,
            b.horizontal_priority,
            b.vertical_priority,
            b.is_curated,
            b.sub_banner_id
        FROM
            banner b
        WHERE b.id IN (?)`
    let params = [bannerIds]
    return await db.query(sql, params)
}

const getBannerDetail = async (bannerId) => {
    let sql = `SELECT * FROM bannerDescription WHERE banner_id = ?`

    let params = [bannerId]
    return await db.query(sql, params)
}

const getBannerDetailByBannerIds = async (bannerIds) => {
    let sql = `SELECT * FROM bannerDescription WHERE banner_id IN (?)`

    let params = [bannerIds]
    return await db.query(sql, params)
}

const getBannerProductsByProductIds = async ({ productId, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit }) => {
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
        WHERE p.id IN (?)`;

    let params = [productId];
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
};

const getBannerProductsCountByProductIds = async ({ productId, parsedPriceFilter, parsedOtherFilter }) => {
    let sql = `SELECT DISTINCT
            p.id AS product_id,
            p.MRP AS product_MRP,
            p.selling_price AS product_selling_price,
            CAST((p.MRP - p.selling_price) AS UNSIGNED) AS discount_amount,
            CONCAT(FORMAT(((p.MRP - p.selling_price) / p.MRP) * 100, 0), '%') AS discount_percentage
        FROM
            products p
        LEFT JOIN specifications sp ON p.id = sp.product_id
        WHERE p.id IN (?)`;

    let params = [productId];
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
};

// const getTopProductsByCategoryId = async (categoryIds) => {
//     let params = [];
//     let sql = `SELECT DISTINCT
//             oi.product_id AS product_id,
//             p.product_name,
//             p.category_id,
//             c.name AS category_name,
//             (
//                 SELECT i.image
//                 FROM images i
//                 WHERE i.product_id = p.id
//                 LIMIT 1
//             ) AS images,
//             p.MRP AS product_MRP,
//             p.selling_price AS product_selling_price,
//             CAST((p.MRP - p.selling_price) AS UNSIGNED) AS discount_amount,
//             CONCAT(FORMAT(((p.MRP - p.selling_price) / p.MRP) * 100, 0), '%') AS discount_percentage,
//             (
//                 SELECT COUNT(*)
//                 FROM orderItems oi2
//                 WHERE oi2.product_id = p.id
//             ) AS total_count
//         FROM
//             orderItems oi
//         JOIN
//             products p ON oi.product_id = p.id
//         JOIN
//             category c ON p.category_id = c.id`
//     if (categoryIds) {
//         sql += ` WHERE p.category_id IN (?)`
//         params.push(categoryIds);
//     }
//     sql += ` ORDER BY total_count DESC`

//     return await db.query(sql, params);
// };

const getAboutUsCategory = async () => {
    let sql = `SELECT
            a.category_id,
            a.name,
            a.image
        FROM
            aboutUsCategory a`

    return await db.query(sql)
}

const getReferralDetails = async ({ userId }) => {
    let sql = `SELECT * FROM referral WHERE user_id = ?`
    let params = [userId]
    return await db.query(sql, params)
}

const getTotalInvite = async (referralCode) => {
    let sql = `SELECT COUNT(*) AS count FROM users WHERE referral_with = ?`
    let params = [referralCode]
    return await db.query(sql, params)
}

module.exports = {
    getBanner,
    getBannerByBannerIds,
    getBannerDetail,
    getBannerDetailByBannerIds,
    getBannerProductsByProductIds,
    getBannerProductsCountByProductIds,
    getAboutUsCategory,
    getReferralDetails,
    getTotalInvite
};