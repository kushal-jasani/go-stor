const {
    getCategoryList,
    getProductsByCategoryId,
    getProductCountByCategoryId,
    getProductsBySubCategoryId,
    getProductCountBySubCategoryId,
    getProductByProductId,
    getProductsByBrand,
    getCategoryIdByProductId,
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

const {
    getCoupons,
    getApplicableCouponsById
} = require('../repository/coupons');

const getApplicableCouponId = async (productId) => {
    const [categoryIdObject] = await getCategoryIdByProductId(productId)
    const categoryId = categoryIdObject[0].category_id;

    let couponIds = [];
    const [couponIdByCategoryId] = await getCoupons(undefined, categoryId)
    couponIds.push(couponIdByCategoryId)

    const [couponIdByProductId] = await getCoupons(productId, undefined)
    couponIds.push(couponIdByProductId)

    const flattenedCouponIds = couponIds.flat();
    const couponIdValues = flattenedCouponIds.map(obj => obj.id);
    const coupon_id = [...new Set(couponIdValues)];
    return coupon_id
}

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
        const [filters] = await getOtherFilters({ categoryIds: [categoryId] });
        filters.map(filter => {
            filter.value_list = JSON.parse(filter.value_list)
        })
        const brandFilter = filters.filter(filter => filter.filter_name === "Brand");
        const otherFilters = filters.filter(filter => filter.filter_name !== "Brand");

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
                        priceFilter: priceFilter1,
                        brandFilter: brandFilter[0],
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
        const [filters] = await getOtherFilters({ subCategoryIds: [subCategoryId] });
        filters.map(filter => {
            filter.value_list = JSON.parse(filter.value_list)
        })
        const brandFilter = filters.filter(filter => filter.filter_name === "Brand");
        const otherFilters = filters.filter(filter => filter.filter_name !== "Brand");

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
                        priceFilter: priceFilter1,
                        brandFilter: brandFilter[0],
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

        let ApplicableCoupons, brandProductsDetails;
        if (product.length) {
            const coupon_id = await getApplicableCouponId(productId);
            if (coupon_id.length) {
                [ApplicableCoupons] = await getApplicableCouponsById(coupon_id)
            }

            let item = product[0], brand, products, brandProducts;
            if (item.specifications) {
                for (let spec of item.specifications) {
                    if (spec.key === 'brand') {
                        brand = spec.value
                    }
                }
            }
            if (brand) {
                [products] = await getProductsByBrand(brand, productId);
                brandProducts = products.filter(product => product.product_id !== parseInt(productId));

                brandProductsDetails = {
                    name: `More from ${brand}`,
                    products: brandProducts
                }
            }
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    product: product.length ? product : `No products found`,
                    ApplicableCoupons,
                    brandProductsDetails
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