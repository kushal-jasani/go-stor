const db=require('../util/db');
const findUserDetails=async (id)=>{
    return await db.query("select name,email,phoneno from users where id = ?", [id]);
}

module.exports={
    findUserDetails
}