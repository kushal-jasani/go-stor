const {
    getCoupons,
    getCouponByCouponId
} = require('../repository/coupons');

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

const isApplicable = async (couponId) => {
    const [couponDetail] = await getCouponByCouponId(couponId)
    const { code, discount_type, discount_value, max_discount, min_price, start_date, expiry_date } = couponDetail[0]

    const currentDate = new Date();
    if (!(currentDate >= start_date && currentDate <= expiry_date)) {
        return 0
    }
    return 1
}

exports.getCoupons = async (req, res, next) => {
    try {
        // const { productId } = req.query;
        const [coupons] = await getCoupons()
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Coupons fetched!',
                data: coupons
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
        const { couponId } = req.params;

        const is_valid = await isApplicable(couponId)
        if (!is_valid) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 200,
                    msg: "Coupon can not be applicable",
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: "Coupon can be applicable"
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