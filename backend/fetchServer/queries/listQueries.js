let config = require('config');
let curr_database = config.get('procurement_db').database ?? 'procurement_2024';
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
WHERE fs.society_id = ? AND fs.carry_forward_status IS null and fs.delete_status is null ${where_clause}
ORDER BY fs.village_code, mf.farmer_name_hi`;
    let listParams = [society_id];
    let countQuery = `SELECT COUNT(fs.fs_id) as total
    FROM farmer_society fs
    LEFT JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    WHERE fs.society_id = ? AND fs.carry_forward_status IS null and fs.delete_status is null ${where_clause}`;
    let countParams = [society_id];
    return [{ "query": listQuery, "params": listParams }, { "query": countQuery, "params": countParams }];

}

exports.getTrustCarryForwardFarmerListForSocietyQueryParamObjArray = function (society_id, farmer_code, from, to) {
    let where_clause = ``;
    if (farmer_code && farmer_code != -1) {
        where_clause += ` AND f.FarmerCode = "${farmer_code}"`;
    }
    let listQuery = `SELECT f.FarmerCode,f.FarmerName,mv.villcdname,s.Society_Name, f.MobileNo FROM farmer_reg_trust_only f
INNER JOIN mas_villages mv ON mv.vsr_census = f.NewVLocationCode
INNER JOIN society s ON s.Society_Id = f.society_id
WHERE f.society_id = ? ${where_clause}
ORDER BY f.FarmerName, f.NewVLocationCode`;
    let listParams = [society_id];

    return ({ "query": listQuery, "params": listParams });

}
exports.getFarmerListBySocietyQueryParamObj = function (society_id) {

    let listQuery = `SELECT fs.total_crop_area, fs.total_land_area, fs.total_paddy_area, mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname,IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
    INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    where fs.society_id = ? AND fs.operation_id NOT IN (3, 5);`;
    let listParams = [society_id];
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
    WHERE fs.operation_id NOT IN (3, 5) AND fs.is_bhumihin_farmer = 'N' AND mt.District_ID = ? AND mt.Tehsil_ID = ?  ${where_clause}
    LIMIT ?, ?`;
    listParams = [+district_id, tehsil_id, offset, size];

    let countQuery = `SELECT COUNT(fs.fs_id) as total
        FROM farmer_society fs
        INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    inner join mas_districts md ON md.District_ID = s.District_Id
    INNER JOIN mas_tehsil mt ON s.District_Id = mt.District_ID AND s.Block_Id = mt.Tehsil_ID 
    where fs.operation_id NOT IN (3, 5) AND fs.is_bhumihin_farmer = 'N' AND mt.District_ID = ? AND mt.Tehsil_ID = ? ${where_clause}`;
    let countParams = [+district_id, tehsil_id];
    return [{ "query": listQuery, "params": listParams }, { "query": countQuery, "params": countParams }]
}

exports.getNewEntryFarmerListBySocietyQueryParamObj = function (society_id) {
    let listQuery = `SELECT fs.operation_id, fs.total_crop_area, fs.total_land_area, fs.total_paddy_area, mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname,IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, 9,LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
    INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    where fs.society_id = ? AND fs.operation_id NOT IN (3, 5) 
    ORDER BY fs.village_code, mf.farmer_name_hi `;
    let listParams = [society_id];
    return { "query": listQuery, "params": listParams }
}

exports.getBaseNotDeletedFarmerListBySocietyQueryParamObj = function (society_id) {
    let listQuery = `SELECT fs.delete_status, mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname, IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, 9,LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
INNER JOIN society s ON s.Society_Id = fs.society_id
INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
WHERE fs.society_id = ? AND (fs.delete_status IS NULL OR fs.delete_status = 'R') AND fs.carry_forward_status IS NULL 
ORDER BY fs.village_code, mf.farmer_name_hi `;
    let listParams = [society_id];
    return { "query": listQuery, "params": listParams }
}

exports.getDeleteReqFarmerListByTehsilQueryParamObj = function (district_id, tehsil_id, search_by, searchWith, village_code, offset, size, isNewFarmer) {
    let where_clause = ``;
    if (village_code && village_code != -1) {
        where_clause += ` AND fs.village_code = ${village_code}`;
    }
    if (isNewFarmer == 'Y') {
        where_clause += ` AND fs.operation_id = 4 `;
    } else {
        where_clause += ` AND fs.delete_status = 'R' AND fs.carry_forward_status is NULL`
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
    let listQuery = `SELECT mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname,mt.Tehsil_Name,md.District_Name, 
    IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name, mf.mobile_no, 
    CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, 9,LENGTH(mf.aadhar_number))) AS aadhar_no FROM farmer_society fs
    INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
    inner join mas_districts md ON md.District_ID = s.District_Id
    INNER JOIN mas_tehsil mt ON s.District_Id = mt.District_ID AND s.Block_Id = mt.Tehsil_ID
    WHERE mt.District_ID = ? AND mt.Tehsil_ID = ?  ${where_clause}
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

exports.getFarmerListForVerificationByRaeoQueryParamObj = function (raeo_id, offset, size, type, search_with, search, village_code) {
    let arr = [], whereClause = ``;
    switch (type) {
        case 1:
            whereClause += ` fs.entry_type_code = 2 AND fs.is_update_society IS NULL AND fs.is_update_tehsil IS NULL `
            break;
        case 2:
            whereClause += ` (fs.is_update_society = 'Y' OR fs.is_update_tehsil = 'Y')`
        default:
            break;
    }
    if (village_code && village_code != -1) {
        whereClause += ` AND fs.village_code = ${village_code}`;
    }

    if (search_with && search && search_with == 1) {
        whereClause += ` AND fs.uf_id = ${search}`;
    } else if (search_with && search && search_with == 2) {
        whereClause += ` AND fs.farmer_code = '${search}'`;
    } else if (search_with && search && search_with == 3) {
        whereClause += ` AND mf.aadhar_number = ${search}`;
    }
    let q = `SELECT mv.villcdname, mf.uf_id, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.father_name, 
    fs.farmer_code, fs.fs_id, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, -4)) AS aadhar_number  
    FROM farmer_society fs 
        INNER JOIN mas_farmer mf ON fs.uf_id = mf.uf_id
        INNER JOIN mas_villages mv ON fs.village_code = mv.vsr_census
        INNER JOIN officer_village_details o ON mv.vsr_census = o.village_code
        WHERE ${whereClause} AND o.officer_code = ? AND fs.operation_id NOT IN (3, 5)
        AND NOT EXISTS (SELECT ra.fs_id FROM raeo_approved ra WHERE ra.fs_id = fs.fs_id)
        LIMIT ?, ?`,
        p = [+raeo_id, offset, size];
    arr.push({ "query": q, "params": p });
    let q1 = `SELECT COUNT(fs.fs_id) AS TOTAL
    FROM farmer_society fs 
        INNER JOIN mas_farmer mf ON fs.uf_id = mf.uf_id
        INNER JOIN mas_villages mv ON fs.village_code = mv.vsr_census
        INNER JOIN officer_village_details o ON mv.vsr_census = o.village_code
        WHERE ${whereClause} AND o.officer_code = ? AND fs.operation_id NOT IN (3, 5)
        AND NOT EXISTS (SELECT ra.fs_id FROM raeo_approved ra WHERE ra.fs_id = fs.fs_id)`,
        p1 = [raeo_id];
    arr.push({ "query": q1, "params": p1 });
    return arr;
}

exports.AllfarmerListForSashodhanVerificationByRaeoQandPObj = function (raeo_id, offset, size, search_with, search, village_code) {
    let arr = [], whereClause = ``;
    if (village_code && village_code != -1) {
        whereClause += ` AND fs.village_code = ${village_code}`;
    }

    if (search_with && search && search_with == 1) {
        whereClause += ` AND fs.uf_id = ${search}`;
    } else if (search_with && search && search_with == 2) {
        whereClause += ` AND fs.farmer_code = '${search}'`;
    } else if (search_with && search && search_with == 3) {
        whereClause += ` AND mf.aadhar_number = ${search}`;
    }

    let q = `SELECT mv.villcdname, mf.uf_id, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.father_name, 
    fs.farmer_code, fs.fs_id, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, -4)) AS aadhar_number  
    FROM farmer_society fs 
        INNER JOIN mas_farmer mf ON fs.uf_id = mf.uf_id
        INNER JOIN mas_villages mv ON fs.village_code = mv.vsr_census
        INNER JOIN officer_village_details o ON mv.vsr_census = o.village_code
        WHERE o.officer_code = ? AND fs.operation_id NOT IN (3, 5) ${whereClause}
        LIMIT ?, ?`,
        p = [+raeo_id, +offset, +size];
    arr.push({ "query": q, "params": p })
    let q1 = `SELECT COUNT(fs.fs_id) AS TOTAL
    FROM farmer_society fs 
        INNER JOIN mas_farmer mf ON fs.uf_id = mf.uf_id
        INNER JOIN mas_villages mv ON fs.village_code = mv.vsr_census
        INNER JOIN officer_village_details o ON mv.vsr_census = o.village_code
        WHERE o.officer_code = ? AND fs.operation_id NOT IN (3, 5) ${whereClause}`,
        p1 = [+raeo_id];
    arr.push({ "query": q1, "params": p1 })
    return arr;
}

exports.getFarmerListForSanshodhanBySADO = function (subdistrict_code, offset, size, type, search_with, search, village_code) {
    let arr = [], whereClause = ``;
    switch (type) {
        case 1:
            whereClause += ` AND rsv.edit_type_adhar_status = 1 `
            break;
        case 2:
            whereClause += ` AND rsv.edit_type_basicDetails_status = 1`;
            break;
        case 3:
            whereClause += ` AND rsv.edit_type_account_status = 1`
            break;
        default:

            break;
    }
    if (village_code && village_code != -1) {
        whereClause += ` AND fs.village_code = ${village_code}`;
    }

    if (search_with && search && search_with == 1) {
        whereClause += ` AND fs.uf_id = ${search}`;
    } else if (search_with && search && search_with == 2) {
        whereClause += ` AND fs.farmer_code = '${search}'`;
    } else if (search_with && search && search_with == 3) {
        whereClause += ` AND mf.aadhar_number = ${search}`;
    }

    let q = `SELECT mv.villcdname, mf.uf_id, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.father_name, 
    fs.farmer_code, fs.fs_id, mf.mobile_no, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, -4)) AS aadhar_number  
    FROM farmer_society fs 
        INNER JOIN mas_farmer mf ON fs.uf_id = mf.uf_id
        INNER JOIN mas_villages mv ON fs.village_code = mv.vsr_census
        INNER JOIN raeo_sanshodhan_verification rsv ON rsv.fs_id = fs.fs_id
        WHERE mv.subdistrictcode_census = ? ${whereClause}
        LIMIT ?, ?`,
        p = [+subdistrict_code, offset, size];
    arr.push({ "query": q, "params": p })
    let q1 = `SELECT COUNT(fs.fs_id) AS TOTAL
    FROM farmer_society fs 
        INNER JOIN mas_farmer mf ON fs.uf_id = mf.uf_id
        INNER JOIN mas_villages mv ON fs.village_code = mv.vsr_census
        INNER JOIN raeo_sanshodhan_verification rsv ON rsv.fs_id = fs.fs_id
        WHERE mv.subdistrictcode_census = ? ${whereClause} `,
        p1 = [subdistrict_code];
    arr.push({ "query": q1, "params": p1 })
    return arr;
}

exports.getfarmerListToGetAadharBySocietyQAndP = function (society_id) {
    let listQuery = `SELECT  fs.FarmerCode as farmer_code, s.Society_Name, v.villcdname, 
    fs.FarmerName AS farmer_name, fs.Father_HusbandName as father_name, 
    fs.MobileNo as mobile_no, fs.FarmerAgrID as uf_id
    FROM farmer_reg_aadhar_null fs
    INNER JOIN society s ON s.Society_Id = fs.society_id
    INNER JOIN mas_villages v ON v.vsr_census = fs.NewVLocationCode
    WHERE fs.society_id = ? AND fs.AadharNo IS NULL`;
    let listParams = [society_id];
    return { "query": listQuery, "params": listParams }
}