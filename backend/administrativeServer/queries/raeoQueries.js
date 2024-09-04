exports.checkFarmerSanshodhanExistOrPending = function (fs_id, checkType, max_sanshodhan_count) {
    let whereClause = ``;
    if (checkType == 1) {
        whereClause += `(rsv.edit_type_adhar_status = 1 
            OR rsv.edit_type_adhar_count >= ${max_sanshodhan_count})`
    }
    else if (checkType == 2) {
        whereClause += `(rsv.edit_type_basicDetails_status = 1 
            OR rsv.edit_type_basicDetails_count >= ${max_sanshodhan_count})`
    }
    else {
        whereClause += `(rsv.edit_type_account_status = 1 
            OR rsv.edit_type_account_count >= ${max_sanshodhan_count})`
    }
    let q = `SELECT rsv.fs_id FROM raeo_sanshodhan_verification rsv
    WHERE rsv.fs_id = ? AND ${whereClause}`,
        p = [fs_id];
    return { "query": q, "params": p };
}