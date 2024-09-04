
module.exports.getLoginDetailsQuery = function (user_id) {
    var q = `SELECT u.user_id,mu.type_name_hi AS 'type_name' ,u.username AS 'name',u.password,u.usertype AS 'user_type',u.district_id, u.tehsil_id,u.password_flag, u.subdistrict_code, u.div_id, 
    max(if(a.key = 2, a.value, (SELECT value FROM app_configuration WHERE id=2))) AS registration_last_date,
     Max(if(a.key = 3, a.value, (SELECT value FROM app_configuration WHERE id=3))) AS carry_last_date,
      max(if(a.key = 4, a.value, (SELECT value FROM app_configuration WHERE id=4))) AS edit_last_date,
       max(if(a.key = 5, a.value, (SELECT value FROM app_configuration WHERE id=5))) AS ganna_last_date,
     NOW() AS today, md.Rev_district_id
    from users u
INNER JOIN mas_user_type mu
ON mu.usertype = u.usertype
LEFT JOIN mas_districts md ON u.district_id = md.District_ID 
LEFT JOIN app_configuration_special a ON a.user_id = u.user_id AND a.is_active = 1
WHERE u.user_id = ? and u.is_active = 1
GROUP BY a.user_id `;
    var p = [user_id];
    return { query: q, params: p };
}

module.exports.getSessionDetailQuery = function (session_id) {
    return { query: "select * from sessions where session_id=? ", params: [session_id] };
}

module.exports.getdeletesessionquery = function (session_id) {
    return { query: `delete from sessions where session_id="${session_id}"`, params: [] };
}

module.exports.getdeleteUserAllSessionquery = function (user_id) {
    return { query: `delete from sessions where user_id="${user_id}"`, params: [] };
}
module.exports.getUserSessionDetailsquery = function (user_id) {
    return { query: `select * from sessions where user_id=?`, params: [user_id] };
}

module.exports.getApiPermissionquery = function (user_type,api_name) {
    return { query: `select * from api_permission where user_type = ? and api_name = ?`, params: [user_type,api_name] };
}

