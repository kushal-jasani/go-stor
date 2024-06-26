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
    getSearchSuggestions,
    categoryFilter,
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
                    category_name: categoryName ? categoryName[0].name : undefined,
                    products: products && products.length ? products : `No products found`,
                    total_products: productsCount ? productsCount.length : 0,
                    filters: {
                        priceFilter: priceFilter1,
                        brandFilter: brandFilter ? brandFilter[0] : undefined,
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
                    subcategory_name: subCategoryName ? subCategoryName[0].name : undefined,
                    products: products && products.length ? products : `No products found`,
                    total_products: productsCount ? productsCount.length : 0,
                    filters: {
                        priceFilter: priceFilter1,
                        brandFilter: brandFilter ? brandFilter[0] : undefined,
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
                    if (spec.key === 'Brand') {
                        brand = spec.value
                    }
                }
            }
            if (brand) {
                [products] = await getProductsByBrand(brand, productId);
                brandProducts = products.filter(product => product.product_id !== parseInt(productId));

                if (brandProducts.length) {
                    brandProductsDetails = {
                        name: `More from ${brand}`,
                        products: brandProducts
                    }
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
        searchProductsCount.forEach(product => {
            productId.push(product.product_id)
        })

        const [price] = await getMaxPrice(productId);
        const priceFilter1 = { min_price: 0, max_price: price[0].max_price };

        let filters, category, brandFilter, otherFilters;
        if (productId.length) {
            [category] = await categoryFilter(productId);

            [filters] = await getOtherFilters(productId);
            filters.map(filter => {
                filter.value_list = JSON.parse(filter.value_list)
            })
            brandFilter = filters.filter(filter => filter.filter_name === "Brand");
            otherFilters = filters.filter(filter => filter.filter_name !== "Brand");
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'searching products successfully',
                data: {
                    searchProductList: searchProducts && searchProducts.length ? searchProducts : `No products found`,
                    total_products: searchProductsCount ? searchProductsCount.length : 0,
                    filters: {
                        categoryFilter: (category && (category.length > 1)) ? category : undefined,
                        priceFilter: priceFilter1,
                        brandFilter: brandFilter ? brandFilter[0] : undefined,
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

exports.searchSuggestions = async (req, res, next) => {
    try {
        let { searchText } = req.query;
        let productNames = [searchText];
        if (searchText && searchText.length >= 3) {
            const [searchSuggestions] = await getSearchSuggestions(searchText)
            const suggestedProductNames = searchSuggestions.map(product => product.product_name);
            productNames = productNames.concat(suggestedProductNames);
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'Products suggestions',
                data: {
                    searchSuggestions: productNames
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