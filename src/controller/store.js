const {
    getStoreList,
    getStoreCount,
    getStoreDetailByStoreId,
    getProductsByStoreId,
    getProductCountByStoreId
} = require('../repository/store');

const {
    getMaxPrice,
    getOtherFilters
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getStore = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [storeList] = await getStoreList(offset, limit)
        const [storeCount] = await getStoreCount()

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'store fetched!',
                data: {
                    storeList: storeList.length ? storeList : `No store found`,
                    total_store: storeCount.length,
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

exports.getProductsByStoreId = async (req, res, next) => {
    try {
        const storeId = req.params.storeId;
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

        const [maxPrice] = await getMaxPrice({ storeId });
        const priceFilter1 = { min_price: 0, max_price: maxPrice[0].max_price };
        const [filters] = await getOtherFilters({ storeId });
        filters.map(filter => {
            filter.value_list = JSON.parse(filter.value_list)
        })
        const brandFilter = filters.filter(filter => filter.filter_name === "Brand");
        const otherFilters = filters.filter(filter => filter.filter_name !== "Brand");

        const [storeData] = await getStoreDetailByStoreId(storeId)
        const [products] = await getProductsByStoreId(storeId, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit)
        const [productsCount] = await getProductCountByStoreId(storeId, parsedPriceFilter, parsedOtherFilter)

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    storeData,
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