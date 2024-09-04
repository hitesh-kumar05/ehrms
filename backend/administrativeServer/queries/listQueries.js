exports.getCarryForwardFarmerListForSocietyQueryParamObjArray = function (society_id, search_by, searchWith, village_code, from, to) {
    let where_clause = ``;
    if (village_code && village_code != -1) {
        where_clause += ` AND fs.village_code = ${village_code}`;
    }
    if (searchWith) {
        switch (search_by) {
            case 1:
                where_clause += ` AND fs.uf_id = ${searchWith} `;
                break;
            case 2:
                where_clause += ` AND fs.farmer_code = '${searchWith}' `;
                break;
            case 3:
                where_clause += ` AND mf.aadhar_number = ${searchWith} `;
                break;
            default:
                where_clause += ``
                break;
        }
    }

    let listQuery = `SELECT mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname, IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, CONCAT('XXXX-XXXX-',9, SUBSTRING(mf.aadhar_number, 9,LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
INNER JOIN society s ON s.Society_Id = fs.society_id
INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
WHERE fs.society_id = ? AND fs.carry_forward_status IS null ${where_clause}
ORDER BY fs.village_code, mf.farmer_name_hi`;
    let listParams = [society_id];
    let countQuery = `SELECT COUNT(fs.fs_id) as total
    FROM farmer_society fs
    LEFT JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    WHERE fs.society_id = ? AND fs.carry_forward_status IS null ${where_clause}`;
    let countParams = [society_id];
    return [{ "query": listQuery, "params": listParams }, { "query": countQuery, "params": countParams }];

}

exports.getFarmerListBySocietyQueryParamObj = function (society_id, entry_type) {
    where_clause = ''
    if (entry_type) {
        where_clause += ` and fs.entry_type = ${entry_type}`
    }
    let listQuery = `SELECT fs.total_crop_area, fs.total_land_area, fs.total_paddy_area, mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname,IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
    INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    where fs.society_id = ? + ${where_clause}`;
    let listParams = [society_id];
    // let countQuery = `SELECT COUNT(fs.fs_id) as total
    //     FROM farmer_society fs
    //     INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    // INNER JOIN society s ON s.Society_Id = fs.society_id
    // INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    // where fs.society_id = ? ${where_clause}`;
    // let countParams = [society_id];
    return [{ "query": listQuery, "params": listParams }]
}

exports.getFarmerListByTehsilQueryParamObj = function (district_id, tehsil_id, search_by, searchWith, village_code, offset, size) {
    let where_clause = ``;
    if (village_code && village_code != -1) {
        where_clause += ` AND fs.village_code = ${village_code}`;
    }
    if (searchWith) {
        switch (search_by) {
            case 1:
                where_clause += ` AND fs.uf_id = ${searchWith} `;
                break;
            case 2:
                where_clause += ` AND fs.farmer_code = '${searchWith}' `;
                break;
            case 3:
                where_clause += ` AND mf.aadhar_number = ${searchWith} `;
                break;
            default:
                where_clause += ``
                break;
        }
    }
    let listQuery = `SELECT fs.total_crop_area, fs.total_land_area, fs.total_paddy_area,  mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname,mt.Tehsil_Name,md.District_Name, 
    IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, 
    CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, 9,LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
    INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    inner join mas_districts md ON md.District_ID = s.District_Id
    INNER JOIN mas_tehsil mt ON s.District_Id = mt.District_ID AND s.Block_Id = mt.Tehsil_ID
    where mt.District_ID = ? AND mt.Tehsil_ID = ?  ${where_clause}
    LIMIT ?, ?`;
    listParams = [+district_id, tehsil_id, offset, size];

    let countQuery = `SELECT COUNT(fs.fs_id) as total
        FROM farmer_society fs
        INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    inner join mas_districts md ON md.District_ID = s.District_Id
    INNER JOIN mas_tehsil mt ON s.District_Id = mt.District_ID AND s.Block_Id = mt.Tehsil_ID 
    where mt.District_ID = ? AND mt.Tehsil_ID = ? ${where_clause}`;
    let countParams = [+district_id, tehsil_id];
    return [{ "query": listQuery, "params": listParams }, { "query": countQuery, "params": countParams }]
}

exports.getNewEntryFarmerListBySocietyQueryParamObj = function (society_id) {
    let listQuery = `SELECT fs.operation_id,fs.total_crop_area, fs.total_land_area, fs.total_paddy_area, mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname,IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, 9,LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
    INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    where fs.society_id = ? and fs.entry_type_code = 2 AND fs.operation_id <> 3 `;
    let listParams = [society_id];
    return { "query": listQuery, "params": listParams }
}

exports.getBaseNotDeletedFarmerListBySocietyQueryParamObj = function (society_id) {
    let listQuery = `SELECT fs.delete_status, mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname, IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, 9,LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
INNER JOIN society s ON s.Society_Id = fs.society_id
INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
WHERE fs.society_id = ? AND (fs.delete_status IS NULL OR fs.delete_status = 'R')
ORDER BY fs.village_code, mf.farmer_name_hi `;
    let listParams = [society_id];
    return { "query": listQuery, "params": listParams }
}