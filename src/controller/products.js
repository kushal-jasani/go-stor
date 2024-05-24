const {
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
    getSubCategoryName
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getCategory = async (req, res, next) => {
    try {
        const [categoryList] = await getCategoryList()
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'category fetched!',
                data: {
                    categoryList: categoryList.length ? categoryList : `No category found`,
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getProductsByCategoryId = async (req, res, next) => {
    try {
        const categoryId = req.params.categoryId;
        let { priceFilter, others, sortBy } = req.query;
        let parsedPriceFilter, parsedOtherFilter;
        try {
            parsedPriceFilter = priceFilter ? JSON.parse(priceFilter) : undefined;
            parsedOtherFilter = others ? JSON.parse(others) : undefined;
        } catch (error) {
            console.error('Error parsing filters: ', error);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [categoryName] = await getCategoryName(categoryId);
        const [maxPrice] = await getMaxPrice({ categoryId });
        const priceFilter1 = { min_price: 0, max_price: maxPrice[0].max_price };
        const [otherFilters] = await getOtherFilters({ categoryIds: [categoryId] });

        const [products] = await getProductsByCategoryId(categoryId, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit)
        const [productsCount] = await getProductCountByCategoryId(categoryId, parsedPriceFilter, parsedOtherFilter)

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    category_name: categoryName[0].name,
                    products: products.length ? products : `No products found`,
                    total_products: productsCount.length,
                    filters: {
                        priceFilter1,
                        otherFilters
                    }
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getProductsBySubCategoryId = async (req, res, next) => {
    try {
        const subCategoryId = req.params.subCategoryId;
        let { priceFilter, others, sortBy } = req.query;
        let parsedPriceFilter, parsedOtherFilter;
        try {
            parsedPriceFilter = priceFilter ? JSON.parse(priceFilter) : undefined;
            parsedOtherFilter = others ? JSON.parse(others) : undefined;
        } catch (error) {
            console.error('Error parsing filters: ', error);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [subCategoryName] = await getSubCategoryName(subCategoryId);
        const [maxPrice] = await getMaxPrice({ subCategoryId });
        const priceFilter1 = { min_price: 0, max_price: maxPrice[0].max_price };
        const [otherFilters] = await getOtherFilters({ subCategoryIds: [subCategoryId] });

        const [products] = await getProductsBySubCategoryId(subCategoryId, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit)
        const [productsCount] = await getProductCountBySubCategoryId(subCategoryId, parsedPriceFilter, parsedOtherFilter)

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    subcategory_name: subCategoryName[0].name,
                    products: products.length ? products : `No products found`,
                    total_products: productsCount.length,
                    filters: {
                        priceFilter1,
                        otherFilters
                    }
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getProductByProductId = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const [product] = await getProductByProductId(productId)
        if (!product.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Products found.',
                })
            );
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: product
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.search = async (req, res, next) => {
    try {
        let { searchText, priceFilter, others, sortBy } = req.query;
        let parsedPriceFilter, parsedOtherFilter;
        try {
            parsedPriceFilter = priceFilter ? JSON.parse(priceFilter) : undefined;
            parsedOtherFilter = others ? JSON.parse(others) : undefined;
        } catch (error) {
            console.error('Error parsing filters: ', error);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [searchProducts] = await searchProductList(searchText, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit)
        const [searchProductsCount] = await searchProductCount(searchText, parsedPriceFilter, parsedOtherFilter, sortBy)

        let productId = [];
        searchProducts.forEach(product => {
            productId.push(product.product_id)
        })

        const [price] = await getMaxPrice(productId);
        const priceFilter1 = { min_price: 0, max_price: price[0].max_price };

        let otherFilters, category;
        if (productId.length) {
            [category] = await categoryFilter(productId);
            [otherFilters] = await filterBySearch(productId)
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'searching products successfully',
                data: {
                    searchProductList: searchProducts.length ? searchProducts : `No products found`,
                    total_products: searchProductsCount.length,
                    filters: {
                        categoryFilter: (category && (category.length > 1)) ? category : undefined,
                        priceFilter1,
                        otherFilters
                    }
                }
            })
        )
    }
    catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'error',
                statusCode: 500,
                msg: 'internal server error'
            })
        )
    }
}

exports.filter = async (req, res, next) => {
    let { searchText, categoryFilter, priceFilter, deliveryTimeFilter, priceOrderFilter } = req.body;
    try {
        if (!priceOrderFilter) {
            priceOrderFilter = "ASC";
        }
        const [products] = await filter({ userId: req.userId, searchText, categoryFilter, priceFilter, deliveryTimeFilter, priceOrderFilter });
        if (!products || !products.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'No Product found for given category and price filter',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: products
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}