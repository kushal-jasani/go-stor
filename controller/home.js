const {
    getBanner
} = require('../repository/home');

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