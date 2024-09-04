
// var getLoginDetailsQuery = function (user_id, season_id) {
//     return { query: `SELECT u.user_id,mu.type_name_hi AS 'type_name' ,u.username AS 'name',u.password,u.usertype AS 'user_type',u.password_flag, 
//      NOW() AS today
//     from users u
// INNER JOIN mas_user_type mu
// ON mu.usertype = u.usertype
// WHERE u.user_id = ? and u.is_active = 1
// `, params: [user_id] };
// }

var getLoginDetailsQuery = function (user_id) {
    return { query: `SELECT u.user_id,mu.type_name_hi AS 'type_name' ,u.username AS 'name',u.password,u.usertype AS 'user_type',u.password_flag, 
     NOW() AS today
    from users u
INNER JOIN mas_user_type mu
ON mu.usertype = u.usertype
WHERE u.user_id = ? and u.is_active = 1
`, params: [user_id] };
}
module.exports.getLoginDetailsQuery = getLoginDetailsQuery;

module.exports.getSessionDetailQuery = function (session_id,season) {
    return { query: "select * from sessions where session_id=? and season = ?", params: [session_id,season] };
}

var getdeletesessionquery = function (session_id) {
    return { query: `delete from sessions where session_id="${session_id}"`, params: [] };
}

var getdeleteUserAllSessionquery = function (user_id) {
    return { query: `delete from sessions where user_id="${user_id}"`, params: [] };
}
var getUserSessionDetailsquery = function (user_id) {
    return { query: `select * from sessions where user_id=?`, params: [user_id] };
}



module.exports.getUserSessionDetailsquery = getUserSessionDetailsquery;
module.exports.getdeleteUserAllSessionquery = getdeleteUserAllSessionquery;
module.exports.getdeletesessionquery = getdeletesessionquery;
