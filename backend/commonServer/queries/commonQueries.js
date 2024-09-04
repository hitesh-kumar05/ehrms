exports.getUserTypeForPassResetOnDDA = function () {
    let q = `SELECT mt.usertype, mt.type_name_hi FROM mas_user_type mt
    WHERE mt.usertype IN (5,6,7,11,12,15,24,26)`,
        p = [];
    return { "query": q, "params": p };
};

exports.getOfficerDetailsByUserIDQueryParamObj = function (user_id) {
    let q = `SELECT 
    m.user_id, CAST(m.user_type AS CHAR) user_type, m.name, m.mobile_no, m.alternate_mobile_no, m.email_id, m.subdistrict_code, m.circle_name, m.district_id,
    GROUP_CONCAT(o.village_code) as villages
    FROM mas_raeo m
    INNER JOIN officer_village_details o ON o.officer_code = m.user_id
    WHERE m.user_id = ?`
    let p = [user_id]
    return { "query": q, "params": p }
}
exports.getOfficerAvailableVillagesQueryParamObj = (subdistrict_code, usertype) => {
    let q = `SELECT m.vsr_census, m.villcdname, if(fl.village_code IS not NULL, 'booked', 'free') booked_status, fl.name, 
    fl.user_id, m.halka, m.VillageID
    FROM mas_villages m
    left JOIN 
    (
    SELECT mv.village_code, mr.name, mr.user_id FROM mas_raeo mr 
    INNER JOIN officer_village_details mv ON mv.officer_code = mr.user_id AND mr.user_type = ${usertype}
    WHERE mr.subdistrict_code = ?
    ) fl ON fl.village_code = m.vsr_census
    WHERE m.subdistrictcode_census = ?`
    let p = [+subdistrict_code, +subdistrict_code]
    return { "query": q, "params": p }
}