const db=require('../util/db');
const findUser=async (phoneno)=>{
    return await db.query("select * from users where phoneno = ?", [phoneno]);

}

const insertUser=async(name, email, phoneno, referral)=>{
    return await db.query('insert into users set ?',{name:name,phoneno:phoneno,email:email,referral:referral})
}

module.exports={
    findUser,
    insertUser
}