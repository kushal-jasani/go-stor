const db = require('../util/db');

const getBanner = async () => {
    let sql = `SELECT
            b.id AS banner_id,
            b.image AS banner_image,
            b.horizontal_priority,
            b.vertical_priority
        FROM
            banner b`

    return await db.query(sql)
}

module.exports = {
    getBanner
};