const {
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
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

const calculateDiscountOnMrp = (products) => {
    products.map(product => {
        discount_amount = product.product_MRP - product.product_selling_price
        product.discount_amount = discount_amount
        product.discount_percentage = parseInt((discount_amount / product.product_MRP) * 100) + "%";
    })
}

exports.getCategory = async (req, res, next) => {
    try {
        const [categoryList] = await getCategoryList()
        if (!categoryList.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Category found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'category fetched!',
                data: categoryList
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

exports.getSubCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.categoryId;
        const [subCategoryList] = await getSubCategoryList(categoryId)
        if (!subCategoryList.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Sub Category found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'sub-category fetched!',
                data: subCategoryList
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
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const [products] = await getProductsByCategoryId(categoryId, offset, limit)
        if (!products.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Products found.',
                })
            );
        }
        calculateDiscountOnMrp(products)

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
                msg: "Internal server error"
            })
        );
    }
}

exports.getProductsBySubCategoryId = async (req, res, next) => {
    try {
        const subCategoryId = req.params.subCategoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const [products] = await getProductsBySubCategoryId(subCategoryId, offset, limit)
        if (!products.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Products found.',
                })
            );
        }
        calculateDiscountOnMrp(products)

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
        calculateDiscountOnMrp(product)

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
        const searchText = req.body.searchText;
        const [searchProducts] = await searchProductList(searchText)

        let productId = [];
        searchProducts.forEach(product => {
            productId.push(product.product_id)
        })
        const [price] = await getMaxPrice(productId);
        const priceFilter = { min_price: 0, max_price: price[0].max_price };
        const [otherFilters] = await filterBySearch(productId)

        let filters = {
            priceFilter,
            otherFilters: otherFilters
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'searching products successfully',
                data: {
                    searchProductList: searchProducts,
                    filters
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

exports.showFilter = async (req, res, next) => {
    try {
        const { categoryId, subCategoryId } = req.body;

        const [price] = await getMaxPrice({ categoryId, subCategoryId });
        const priceFilter = { min_price: 0, max_price: price[0].max_price };

        const [otherFilters] = await getOtherFilters({ categoryId, subCategoryId });

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'filter option showed successfully',
                data: {
                    "priceFilter": priceFilter,
                    "otherFilters": otherFilters,
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