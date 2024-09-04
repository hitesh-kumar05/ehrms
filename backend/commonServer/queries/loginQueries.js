exports.login22_userLogin_QueryParamObj = (user_id) => {
    return ({
        query: `SELECT ml.user_id as _id,  ml.username,  ml.usertype, rv.SubDistrictCodeCensus AS subdistrict_code, rv.BlockNameEng AS subdistrict_name, rv.DistCodeCensus AS district_code, rv.DistrictName AS district_name,rv.district_id,rv.TehsilCensus,rv.DistrictTehsilID as TehsilID
    ,rv.TehsilName,rv.BlockCode
    FROM mas_login ml
    LEFT JOIN mas_society ms ON ml.user_id = ms.society_id
    LEFT JOIN rev_villages rv ON ms.village_code = rv.village_code
    WHERE ml.user_id =10021`, params: [user_id]
    });
}

exports.login22_newLogin_QueryParamObj = (district_code, user_type) => {
    return ({
        query: `Select  mr.district_code as _id,  mr.district_name as username,
    rd.district_id,   rd.DistrictNameHindi , rd.DivisionDistrictID , rd.div_id from login mr
    left join rev_district rd on mr.district_code = rd.DistrictCensus
     where mr.district_code= ? and mr.department_code = 2 and mr.usertype = ?`, params: [district_code, user_type]
    });

}

exports.login22_raeoLogin_QueryParamObj = (officer_code, user_type) => {
    return ({
        query: `Select mr.officer_code as _id,  mr.name as username,  mr.district_code,
    mr.subdistrict_code, b.district_name,b.subdistrict_name 
   from mas_raeo mr left join mas_subdistricts b on mr.subdistrict_code = b.subdistrict_code 
   where mr.officer_code=? and mr.usertype=?`, params: [officer_code, user_type]
    });
}

exports.login22_otherAndHortiLogin_QueryParamObj = (district_code, department_code) => {
    return ({
        query: `Select  mr.district_code as _id,  mr.district_name as username, rd.district_id,  rd.DistrictNameHindi ,
     rd.DivisionDistrictID , rd.div_id from tbl_login mr
    left join rev_district rd on mr.district_code = rd.DistrictCensus
     where mr.district_code= ? and mr.department_code = ?`, params: [district_code, department_code]
    });
}

exports.getPasswordResetQueryParam = function (Case, user_id, user_type, div_id, district_id, tehsil_id, subdistrict_code) {
    let whereClause = ` WHERE `;
    switch (Case) {
        case 1:
            whereClause += ` u.usertype = ${user_type}`;
            break;
        case 2:
            whereClause += ` u.usertype = ${user_type} AND u.user_id = ${user_id}`;
            break;
        case 3:
            whereClause += ` u.usertype = ${user_type} AND u.div_id = ${div_id}`;
            break;
        case 4:
            whereClause += ` u.usertype = ${user_type} AND u.district_id = ${district_id}`;
            break;
        case 5:
            whereClause += ` u.usertype = ${user_type} AND u.district_id = ${district_id} AND u.tehsil_id = ${tehsil_id}`;
            break;
        case 6:
            whereClause += ` u.usertype = ${user_type} AND u.district_id = ${district_id} AND u.subdistrict_code = ${subdistrict_code}`;
            break;
        default:
            break;
    }
    let q = `UPDATE users u
    SET u.password = DEFAULT,
    u.password_flag = 0 ${whereClause};`,
        p = [];
    return { "query": q, "params": p };
}
exports.userDetailsByUserId = function (user_id) {
    return {
        query: `SELECT u.*,md.District_Name from users u 
            left JOIN mas_districts md ON md.District_ID = u.district_id
            where u.user_id =  ${user_id} `, params: []
    }
}
exports.getBankLoginDetails = function (bank_login_id) {
    return {
        query: ` SELECT u.username,mcb.district_id FROM users u
    INNER JOIN mas_user_type mut ON u.usertype = mut.usertype
    LEFT JOIN mas_cooperative_bank mcb ON mcb.c_bank_code = u.user_id
    WHERE u.user_id =  ${bank_login_id} `, params: []
    }
}


