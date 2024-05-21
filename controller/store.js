const {
    getStoreList,
    getStoreDetailByStoreId,
    getProductsByStoreId,
    getProductCountByStoreId
} = require('../repository/store');

const { generateResponse, sendHttpResponse } = require("../helper/response");

const calculateDiscountOnMrp = (products) => {
    products.map(product => {
        discount_amount = product.product_MRP - product.product_selling_price
        product.discount_amount = discount_amount
        product.discount_percentage = parseInt((discount_amount / product.product_MRP) * 100) + "%";
    })
}

exports.getStore = async (req, res, next) => {
    try {
        const [storeList] = await getStoreList()
        if (!storeList.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Store found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'store fetched!',
                data: storeList
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
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const [storeData] = await getStoreDetailByStoreId(storeId)
        const [products] = await getProductsByStoreId(storeId, offset, limit)
        const [productsCount] = await getProductCountByStoreId(storeId, offset, limit)

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
                data: {
                    storeData,
                    products,
                    total_products: productsCount[0].total_products
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