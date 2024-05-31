const db = require('../util/db');

const insertAddress = async ({ user_id, name, mobileNumber, email, address, pinCode, city, state, is_primary }) => {
    let sql = `INSERT INTO address SET ?`

    let params = { user_id, name, mobile_number: mobileNumber, email, address, pin_code: pinCode, city, state, is_primary }
    return await db.query(sql, params)
}

const updateAddress = async ({ is_primary, addressId }) => {
    let sql = `UPDATE address SET is_primary = ? WHERE id = ?`

    let params = [is_primary, addressId]
    return await db.query(sql, params)
}

const insertOrderAddress = async (addressDetail) => {
    const { name, mobile_number, email, address, pin_code, city, state } = addressDetail
    let sql = `INSERT INTO orderAddress SET ?`

    let params = { name, mobile_number, email, address, pin_code, city, state }
    return await db.query(sql, params)
}

const getAddress = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = `SELECT id, name, mobile_number, email, address, pin_code, city, state, is_primary FROM address WHERE `;
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.query(sql, values);
}

const getUserIdByAddress = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = `SELECT user_id FROM address WHERE `;
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.query(sql, values);
}

const deleteAddress = async ({ userId, address_id }) => {
    let sql = `DELETE FROM address WHERE (id = ? AND user_id = ?)`

    let params = [address_id, userId]
    return await db.query(sql, params)
}

module.exports = {
    insertAddress,
    updateAddress,
    insertOrderAddress,
    getAddress,
    getUserIdByAddress,
    deleteAddress
};