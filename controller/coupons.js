const {
    getCoupons,
    getApplicableCouponsById,
    getNotApplicableCouponsById,
    getCouponByCouponId,
    getCouponByCode
} = require('../repository/coupons');

const {
    getOrderCount
} = require('../repository/order');

const {
    getProductByProductId,
    getCategoryIdByProductId
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

const getFormattedDate = (dateString) => {
    // Create a Date object
    const date = new Date(dateString);

    // Get the day, month, and year
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    // Format the date string
    const formattedDate = `${day}th ${month}, ${year}`;
    return formattedDate;
}

const isApplicable = async (couponId, order_total, orderCount) => {
    const [couponDetail] = await getCouponByCouponId(couponId)
    const { min_price, valid_on_order_number, start_date, expiry_date } = couponDetail[0]

    const currentDate = new Date();
    if (!(currentDate >= start_date && currentDate <= expiry_date)) {
        return 0
    }
    if (order_total < min_price) {
        return 0
    }
    if (orderCount > valid_on_order_number) {
        return 0
    }
    return 1
}

const getApplicableCouponId = async (productId) => {
    const [categoryIdObject] = await getCategoryIdByProductId(productId)
    const categoryIds = categoryIdObject.map(obj => obj.category_id);

    let couponIds = [];
    await Promise.all(
        categoryIds.map(async (categoryId) => {
            const [couponId] = await getCoupons(undefined, categoryId)
            couponIds.push(couponId)
        })
    );
    await Promise.all(
        productId.map(async (product) => {
            const [couponId] = await getCoupons(product, undefined)
            couponIds.push(couponId)
        })
    );

    const flattenedCouponIds = couponIds.flat();
    const couponIdValues = flattenedCouponIds.map(obj => obj.id);
    const coupon_id = [...new Set(couponIdValues)];
    return coupon_id
}

exports.getCoupons = async (req, res, next) => {
    try {
        const { productId } = req.query;
        let parsedProductId;
        try {
            parsedProductId = JSON.parse(productId);
        } catch (error) {
            console.error('Error parsing filters: ', error);
        }

        const coupon_id = await getApplicableCouponId(parsedProductId)
        const [ApplicableCoupons] = await getApplicableCouponsById(coupon_id)
        const [NotApplicableCoupons] = await getNotApplicableCouponsById(coupon_id)
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Coupons fetched!',
                data: {
                    ApplicableCoupons,
                    NotApplicableCoupons
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

exports.getTermsByCouponId = async (req, res, next) => {
    try {
        const { couponId } = req.params;
        const [couponDetail] = await getCouponByCouponId(couponId)
        const { code, discount_type, discount_value, max_discount, min_price, start_date, expiry_date } = couponDetail[0]

        const startDateString = start_date;
        const startDate = startDateString !== null ? getFormattedDate(startDateString) : null

        const expiryDateString = expiry_date;
        const expiryDate = getFormattedDate(expiryDateString)

        let TermsAndConditions = {
            1: `Coupon code - ${code} (Click the instant Off on the Checkout Page)`,
            2: `Instant Discount of ${discount_value}${discount_type === 'fixed' ? '' : '%'} ${max_discount !== null ? 'Up to INR. ' + max_discount + '/-' : ''}`,
            3: `Valid on your 1st order within the offer period (${startDate !== null ? 'Between ' + startDate + ' and' : 'till'} ${expiryDate})`,
            4: `Cannot be clubbed with any other offer`,
            5: `Minimum Transaction value of INR. ${min_price}`
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Coupon T&C fetched!',
                data: TermsAndConditions
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

exports.applyCoupon = async (req, res, next) => {
    try {
        const { products, code } = req.query;
        const [coupon] = await getCouponByCode(code);
        if (!coupon.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 200,
                    msg: "Coupon not found!",
                })
            );
        }
        const { id: couponId, discount_type, discount_value, max_discount } = coupon[0];

        let parsedProducts;
        try {
            parsedProducts = JSON.parse(products);
        } catch (error) {
            console.error('Error parsing filters: ', error);
        }

        let order_sub_total = 0;
        await Promise.all(
            parsedProducts.map(async (product) => {
                const [productDetail] = await getProductByProductId(product.id)
                order_sub_total += parseFloat(productDetail[0].product_selling_price) * parseFloat(product.quantity)
            })
        );
        order_sub_total = order_sub_total.toFixed(2);
        let [orderCount] = await getOrderCount({ user_id: req.user.userId })

        let is_valid = await isApplicable(couponId, order_sub_total, orderCount)

        const ids = parsedProducts.map(obj => obj.id);
        const coupon_id = await getApplicableCouponId(ids)

        if (!coupon.length || !coupon_id.includes(couponId)) {
            is_valid = 0;
        }

        let discount_amount = 0;
        if (discount_type === 'fixed') {
            discount_amount = discount_value
        } else if (discount_type === 'rate') {
            const rated_discount = (order_sub_total * discount_value) / 100
            discount_amount = rated_discount > max_discount ? max_discount : rated_discount
        }

        if (!is_valid) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 200,
                    msg: "COUPON IS NOT APPLICABLE, PLEASE REFER TO THE TERMS AND CONDITIONS FOR MORE DETAILS.",
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: "Coupon can be applicable",
                data: {
                    couponId,
                    discount_amount
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