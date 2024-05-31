const {
    insertAddress,
    updateAddress,
    getAddress,
    deleteAddress
} = require('../repository/address');

const {
    addressSchema
} = require("../validator/orderValidationSchema");

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.address = async (req, res, next) => {
    try {
        const [address] = await getAddress({ user_id: req.user.userId })
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Address fetched!',
                data: address
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

exports.changePrimaryAddress = async (req, res, next) => {
    try {
        const { addressId } = req.params;
        const [allAddress] = await getAddress({ user_id: req.user.userId })
        const allAddressIds = allAddress.map(address => address.id)
        if (!allAddressIds.includes(parseInt(addressId))) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 404,
                    msg: 'Invalid addressId',
                })
            );
        }

        const [oldPrimaryAddress] = await getAddress({ user_id: req.user.userId, is_primary: 1 })
        await updateAddress({ is_primary: 0, addressId: oldPrimaryAddress[0].id })
        await updateAddress({ is_primary: 1, addressId })
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Primary Address changed!',
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

exports.addAddress = async (req, res, next) => {
    const { error } = addressSchema.validate(req.body);
    if (error) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 400,
                msg: error.details[0].message
            })
        );
    }
    const { name, mobileNumber, email, address, pinCode, city, state } = req.body;
    try {
        const [oldPrimaryAddress] = await getAddress({ user_id: req.user.userId, is_primary: 1 })
        await updateAddress({ is_primary: 0, addressId: oldPrimaryAddress[0].id })

        const [newPrimaryAddress] = await insertAddress({ user_id: req.user.userId, name, mobileNumber, email, address, pinCode, city, state, is_primary: 1 })
        if (!newPrimaryAddress.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Try again',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Adding address successful.',
                data: {
                    addressId: newPrimaryAddress.insertId
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

exports.deleteAddress = async (req, res, next) => {
    const { addressId } = req.params;
    try {
        const [updated] = await deleteAddress({ userId: req.user.userId, address_id: addressId })
        if (!updated.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error, deleting address failed!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Deleting address successful.'
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