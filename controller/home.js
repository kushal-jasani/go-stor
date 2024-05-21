const {
    getBanner,
    getBannerDetail,
    getBannerProducts,
    getBannerProductCount
} = require('../repository/home');

const {
    getMaxPrice,
    getOtherFilters
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.home = async (req, res, next) => {
    try {
        const [banner] = await getBanner();
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Home',
                data: {
                    banner
                }
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

exports.getProductsByBannerId = async (req, res, next) => {
    try {
        const bannerId = req.params.bannerId;
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

        let bannerDiscount;
        const [bannerDetail] = await getBannerDetail(bannerId)
        if (bannerDetail[0].key === 'discount upto') {
            bannerDiscount = bannerDetail[0].value
        }

        let category_id, subcategory_id, max = 0;
        if (bannerDetail[0].category_id !== null) {
            category_id = bannerDetail[0].category_id;
            let [categoryMaxPrice] = await getMaxPrice({ category_id })
            max = Math.max(max, categoryMaxPrice[0].max_price);
        }
        if (bannerDetail[0].subcategory_id !== null) {
            subcategory_id = bannerDetail[0].subcategory_id;
            let [subcategoryMaxPrice] = await getMaxPrice({ subcategory_id })
            max = Math.max(max, subcategoryMaxPrice[0].max_price);
        }

        const priceFilter1 = { min_price: 0, max_price: max };

        const [products] = await getBannerProducts({ categoryId: category_id, subCategoryId: subcategory_id, bannerDiscount, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit });
        const [bannerProductsCount] = await getBannerProductCount({ categoryId: category_id, subCategoryId: subcategory_id, bannerDiscount, parsedPriceFilter, parsedOtherFilter, sortBy });

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Banner Products fetched!',
                data: {
                    products: products.length ? products : `No products found`,
                    total_products: bannerProductsCount.length,
                    filters: {
                        priceFilter1
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
                msg: "Internal server error",
            })
        );
    }
}