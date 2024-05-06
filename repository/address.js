const db = require('../util/db');

const insertAddress = async ({ user_id, name, mobileNumber, email, address, pinCode }) => {
    let sql = `INSERT INTO address SET ?`

    let params = { user_id, name, mobile_number: mobileNumber, email, address, pin_code: pinCode }
    return await db.query(sql, params)
}

const getAddress = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = `SELECT id, name, mobile_number, email, address, pin_code FROM address WHERE `;
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
    getAddress,
    deleteAddress
};