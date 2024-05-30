const db = require('../util/db');
const findUser = async (phoneno) => {
    return await db.query("select * from users where phoneno = ?", [phoneno]);

}

const insertUser = async (name, email, phoneno, referral) => {
    return await db.query('insert into users set ?', { name, phoneno, email, referral_with: referral })
}

const insertReferralDetail = async (userId, referralCode) => {
    let sql = `INSERT INTO referral SET ?`

    let params = { user_id: userId, code: referralCode }
    return await db.query(sql, params)
}

module.exports = {
    findUser,
    insertUser,
    insertReferralDetail
}