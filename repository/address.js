const db = require('../util/db');

const insertAddress = async ({ user_id, name, mobileNumber, email, address, pinCode, city, state }) => {
    let sql = `INSERT INTO address SET ?`

    let params = { user_id, name, mobile_number: mobileNumber, email, address, pin_code: pinCode, city, state }
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

    let sql = `SELECT id, name, mobile_number, email, address, pin_code, city, state FROM address WHERE `;
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
    insertOrderAddress,
    getAddress,
    getUserIdByAddress,
    deleteAddress
};