const db = require('../util/db');

const getCategoryList = async () => {
    let sql = `SELECT
            c.id AS category_id,
            c.name AS category_name,
            c.image AS category_image,
            CASE
                WHEN COUNT(s.id) > 0 THEN
                    JSON_ARRAYAGG(JSON_OBJECT('subcategory_id', s.id, 'subcategory_name', s.name))
                ELSE
                    NULL
            END AS subcategories
        FROM category c
        LEFT JOIN subCategory s ON c.id = s.category_id
        GROUP BY c.id, c.name, c.image`
    return await db.query(sql);
}

const getProductsByCategoryId = async (categoryId, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit) => {
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
            products p`;

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

    // Add WHERE clause for category filter
    sql += ` WHERE p.category_id = ?`;
    params.push(categoryId);

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

const getProductCountByCategoryId = async (categoryId, parsedPriceFilter, parsedOtherFilter, sortBy) => {
    let sql = `SELECT DISTINCT
            COUNT(DISTINCT p.id) AS total_products
        FROM
            products p`;

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

    // Add WHERE clause for category filter
    sql += ` WHERE p.category_id = ?`;
    params.push(categoryId);

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

const getProductsBySubCategoryId = async (subCategoryId, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit) => {
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
            products p`;

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

    // Add WHERE clause for category filter
    sql += ` WHERE p.subcategory_id = ?`;
    params.push(subCategoryId);

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

const getProductCountBySubCategoryId = async (subCategoryId, parsedPriceFilter, parsedOtherFilter, sortBy) => {
    let sql = `SELECT DISTINCT
            COUNT(DISTINCT p.id) AS total_products
        FROM
            products p`;

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

    // Add WHERE clause for category filter
    sql += ` WHERE p.subcategory_id = ?`;
    params.push(subCategoryId);

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

const getProductByProductId = async (productId) => {
    let sql = `SELECT
            p.id AS product_id,
            p.product_name AS product_name,
            p.MRP AS product_MRP,
            p.selling_price AS product_selling_price,
            CAST((p.MRP - p.selling_price) AS UNSIGNED) AS discount_amount,
            CONCAT(FORMAT(((p.MRP - p.selling_price) / p.MRP) * 100, 0), '%') AS discount_percentage,
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

const searchProductList = async (searchText, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit) => {
    let params = [];
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
        FROM products p
        LEFT JOIN
            subCategory s ON p.subcategory_id = s.id
        JOIN
            category c ON p.category_id = c.id
        LEFT JOIN
            specifications sp ON sp.product_id = p.id
        WHERE
            (c.name LIKE ? OR
            s.name LIKE ? OR
            p.product_name LIKE ? OR
            (sp.key = 'brand' AND sp.value LIKE ?))`
    const searchParam = `%${searchText}%`;
    params.push(searchParam, searchParam, searchParam, searchParam)

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
            sql += ` AND (${joinConditions.join(' OR ')})`;
            params.push(...joinParams);
        }
    }

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

const searchProductCount = async (searchText, parsedPriceFilter, parsedOtherFilter, sortBy) => {
    let params = [];
    let sql = `SELECT DISTINCT
            COUNT(DISTINCT p.id) AS total_products
        FROM products p
        LEFT JOIN
            subCategory s ON p.subcategory_id = s.id
        JOIN
            category c ON p.category_id = c.id
        LEFT JOIN
            specifications sp ON sp.product_id = p.id
        WHERE
            (c.name LIKE ? OR
            s.name LIKE ? OR
            p.product_name LIKE ? OR
            (sp.key = 'brand' AND sp.value LIKE ?))`
    const searchParam = `%${searchText}%`;
    params.push(searchParam, searchParam, searchParam, searchParam)

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
            sql += ` AND (${joinConditions.join(' OR ')})`;
            params.push(...joinParams);
        }
    }

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

const categoryFilter = async (productId) => {
    let sql = `SELECT DISTINCT
            CASE 
                WHEN s.id IS NOT NULL THEN JSON_OBJECT('subcategory_id', sc.id, 'subcategory_name', sc.name)
                ELSE JSON_OBJECT('category_id', c.id, 'category_name', c.name)
            END AS category
        FROM products p
        LEFT JOIN subCategory sc ON p.subcategory_id = sc.id
        JOIN category c ON p.category_id = c.id
        LEFT JOIN subCategory s ON c.id = s.category_id
        WHERE p.id IN (?)`

    params = [productId]
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
                    percentage >= 50
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

    console.log(sql, params)
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
                WHEN MAX(p.selling_price) < 10000 THEN '10000'
                ELSE FLOOR(MAX(p.selling_price) / 10000) * 10000
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
                percentage >= 75
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

const getCategoryName = async (categoryId) => {
    let sql = `SELECT name FROM category WHERE id = ?`

    let params = [categoryId];
    return await db.query(sql, params);
}

const getSubCategoryName = async (subCategoryId) => {
    let sql = `SELECT name FROM subCategory WHERE id = ?`

    let params = [subCategoryId];
    return await db.query(sql, params);
}

const getCategoryIdByProductId = async (productId) => {
    let sql = `SELECT DISTINCT category_id
    FROM products
    WHERE id IN (?)`

    let params = [productId];
    return await db.query(sql, params);
}

module.exports = {
    getCategoryList,
    getProductsByCategoryId,
    getProductCountByCategoryId,
    getProductsBySubCategoryId,
    getProductCountBySubCategoryId,
    getProductByProductId,
    searchProductList,
    searchProductCount,
    categoryFilter,
    filterBySearch,
    // getBrandList,
    getMaxPrice,
    getOtherFilters,
    getCategoryName,
    getSubCategoryName,
    getCategoryIdByProductId
};