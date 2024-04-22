const { findUserDetails } = require("../repository/user");

const { generateResponse, sendHttpResponse } = require("../helper/response");


exports.userDetail = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [userDetails] = await findUserDetails(userId);
    if (!userDetails) {
      return sendHttpResponse(
        req,
        res,
        next,
        generateResponse({
          status: "error",
          statusCode: 404,
          msg: "no user found😓",
        })
      );
    }
    return sendHttpResponse(
      req,
      res,
      next,
      generateResponse({
        statusCode: 200,
        status: "success",
        data: { userDetails },
        msg: "data retrived successfully✅",
      })
    );
  } catch (error) {
    console.log("while fetching user detail", error);
    return sendHttpResponse(
      req,
      res,
      next,
      generateResponse({
        status: "error",
        statusCode: 500,
        msg: "internal server error while fetching user details",
      })
    );
  }
};
