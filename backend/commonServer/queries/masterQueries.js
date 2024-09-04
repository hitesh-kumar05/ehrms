exports.getAllDesignationQueryParamObj = function () {
    let q = `SELECT md.designation_code,md.designation_name_en,md.designation_name_hi
 FROM mas_desgination md `;
    return ({ query: q, params: [] });
};

//////////making query for cast//////////
exports.getAllCasteQueryParamObj = function () {
    let q = `SELECT mc.caste_code,mc.caste_name FROM mas_caste mc  `;
    return ({ query: q, params: [] });
};
exports.getAllReligionQueryParamObj = function () {
    let q = `SELECT mr.religion_code,mr.religion_name FROM mas_religion mr  `;
    return ({ query: q, params: [] });
};
exports.getAllOfficeLevelQueryParamObj = function () {
    let q = `SELECT mol.office_level_code,mol.office_level_name_en FROM mas_office_level mol  `;
    return ({ query: q, params: [] });
};

exports.getAllOfficeTypeQueryParamObj = function () {
    let q = `SELECT mot.office_type_name_en,mot.office_type_name_hi FROM mas_office_type mot `;
    return ({ query: q, params: [] });
};

exports.getAllOfficeTypeQueryParamObj = function () {
    let q = `SELECT mot.office_type_code,mot.office_type_name_en FROM mas_office_type mot  `;
    return ({ query: q, params: [] });
};
exports.getAllDistrictsQueryParamObj = function () {
    let q = `SELECT dis.district_code,dis.district_name_en FROM mas_districts dis`;
    return ({ query: q, params: [] });
};
exports.getAllBlockQueryParamObj = function () {
    let q = `SELECT sdis.subdistrict_code,sdis.subdistrict_name FROM mas_subdistricts sdis `;
    return ({ query: q, params: [] });
};

exports.getBlockByDistQueryParamObj = function (district_code) {
    let q = `SELECT  MSB.district_code,MSB.subdistrict_code,MSB.subdistrict_name 
    FROM  mas_subdistricts MSB
    INNER JOIN mas_districts MD ON MSB.district_code = MD.district_code WHERE MSB.district_code=?;`;
    return ({ query: q, params: [district_code] });
};

exports.getBlockByDistQueryParamObj = function (district_code) {
    let q = `SELECT  MSB.district_code,MSB.subdistrict_code,MSB.subdistrict_name 
    FROM  mas_subdistricts MSB
    INNER JOIN mas_districts MD ON MSB.district_code = MD.district_code WHERE MSB.district_code=?;`;
    return ({ query: q, params: [district_code] });
};
exports.getOfficeDetailsReportQueryParamObj = function (district_code) {
    let q = `SELECT mas_office_details.office_name_en,
            mas_office_details.office_name_hi,
            mas_office_level.office_level_name_en,
            mas_office_type.office_type_name_en,
            mas_districts.district_name_en ,
            mas_subdistricts.subdistrict_name,
            mas_office_details.office_address
            FROM mas_office_details 
            INNER JOIN mas_office_level  ON mas_office_details.office_level_code = mas_office_level.office_level_code
            INNER JOIN mas_office_type  ON mas_office_details.office_type_code = mas_office_type.office_type_code
            INNER JOIN mas_districts  ON mas_office_details.district_code = mas_districts.district_code
            INNER JOIN mas_subdistricts  ON mas_office_details.block_code = mas_subdistricts.subdistrict_code`;
    return ({ query: q, params: [district_code] });
};


exports.getMenuByUserQueryParamObj = function (user_type) {
    let q = `SELECT m.menuCode, m.type, m.name, m.route, m.children, m.icon, m.usertype, m.mainmenuCode,m.menuOrder,m.is_new FROM mas_menu m WHERE m.usertype = ? AND m.is_active = 1
    ORDER BY m.menuOrder ;`;
    return ({ query: q, params: [user_type] });
};

exports.getAllDistrictQueryParamObj = function () {
    let q = `SELECT cast(d.District_ID as signed) as district_id ,d.District_Name, d.District_Name_Eng,d.LGD_Code, b.c_bank_code FROM mas_districts d
LEFT JOIN mas_cooperative_bank_district b ON b.district_id=d.District_ID
ORDER BY d.District_Name_Eng`;
    return ({ query: q, params: [] });
};

exports.getVillageListBySubdistrict = function (subdistrict_code) {
    let q = `SELECT d.villcdname, d.vsr_census, d.halka FROM mas_villages d
    WHERE d.subdistrictcode_census = ?
    ORDER BY d.villcdname`
    return ({ query: q, params: [subdistrict_code] });
}

exports.getTehsilByDistrictQueryParamObj = function (district_id) {
    let q = `SELECT t.Tehsil_ID AS tehsil_id, t.Tehsil_Name AS tehsil_name, t.Tehsil_Name_En AS tehsil_name_en,
                t.CensusCode AS census_code
                FROM mas_tehsil t
                WHERE t.District_ID = ?;`
    return ({ query: q, params: [district_id] });
};

exports.getVillageByDistrictAndTehsilQueryParamObj = function (district_id, tehsil_id) {
    let q = `SELECT d.vsr_census, d.villcdname, d.VillageID, d.VillType, d.halka, d.halkanm, d.cdname,
    d.tehcdname, d.rino FROM mas_villages d
INNER JOIN mas_tehsil mt
ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
WHERE mt.District_ID = ? AND mt.Tehsil_ID = ? 
ORDER BY d.villcdname;`
    return ({ query: q, params: [district_id, tehsil_id] });
};

exports.getMasCasteQueryParamObj = function () {
    let q = `SELECT DISTINCT c.caste_code, c.caste_name FROM mas_caste c
ORDER BY c.caste_code desc ;`;
    return ({ query: q, params: [] });
}

exports.getMasSubCasteQueryParamObj = function (caste_code) {
    let q = `SELECT c.subcaste_code, c.subcaste_name FROM mas_caste c
    WHERE c.caste_code = ?
    ORDER BY c.subcaste_code desc`;
    return ({ query: q, params: [caste_code] });
}

exports.getMasRelationQueryParamObj = function () {
    let q = `SELECT * from mas_relation mr 
    WHERE mr.is_active = 1`;
    return ({ query: q, params: [] });
}

exports.getAllBanksQueryParamObj = function () {
    let q = `SELECT * FROM mas_bank mb
ORDER BY mb.bank_name`;;
    return ({ query: q, params: [] });
};

exports.getVillageListBySocietyQueryParamObj = function (society_id) {
    let q = `SELECT DISTINCT cast(s.Newvulocation as signed) AS 'village_code' , s.vlocationname AS 'village_name' , 
    s.vsrcensus, d.VillageID, mt.Tehsil_Name, md.District_Name,d.halka, d.halkanm
        FROM society_details_mapped s
        INNER JOIN mas_villages d ON d.vsr_census = s.Newvulocation
        INNER JOIN mas_tehsil mt ON d.distno = mt.Rev_dist_id AND d.tehsilno = mt.Rev_teh_id
        INNER JOIN mas_districts md ON md.Rev_district_id = d.distno
        WHERE s.Society_Id = ?;`;
    return ({ query: q, params: [society_id] });
};

exports.getBankBranchByDistrictAndBankQueryParamObj = function (district_id, bank_id) {
    let q = `SELECT * FROM mas_bankbranch mbb 
    WHERE mbb.branch_name <> 'OTHER STATE' AND mbb.branch_code NOT IN (152151, 155111) AND mbb.bank_code = ? AND mbb.district_id = ?
    ORDER BY mbb.branch_name`;
    return ({ query: q, params: [bank_id, district_id] });
}

exports.getSocietyListQueryParamObj = function (whereKey, district_id, tehsil_id) {
    let whereClause = ``
    if (whereKey == 1 && district_id) {
        whereClause = `WHERE s.District_Id = ${district_id}`;
    }
    else if (whereKey == 2 && district_id && tehsil_id) {
        whereClause = `WHERE s.District_Id = ${district_id} AND s.Block_Id = ${tehsil_id}`;
    }
    let q = `SELECT s.Society_Id, TRIM(s.Society_Name) as Society_Name FROM society s ${whereClause}`;
    return ({ query: q, params: [] });
}

exports.getAllCropQueryParamObj = function (whereKey, district_id, tehsil_id) {
    let q = ` SELECT mc.crop_code,mc.crop_name FROM mas_crop mc`;
    return ({ query: q, params: [] });
}

exports.getAllVillagesOfUserId = function (user_id) {
    let q = `SELECT ofd.village_code, mv.villcdname, mv.halka FROM officer_village_details ofd
    INNER JOIN mas_villages mv ON ofd.village_code = mv.vsr_census
    where ofd.officer_code = ?`,
        p = [user_id];
    return { "query": q, "params": p };
}
exports.getAllSocietyListByBankIdQueryParam = function (bank_id) {
    let q = `SELECT s.society_id, s.Society_Name FROM mas_cooperative_bank_district mc
    INNER JOIN society s ON s.District_Id = mc.district_id
    WHERE mc.c_bank_code = ?`,
        p = [bank_id];
    return { "query": q, "params": p };
}
exports.BlockOfficerListUsingDistrictID = function (district_id) {
    let q = `SELECT
    m.name, u.user_id, u.usertype as 'user_type', u.district_id, u.subdistrict_code, 
    rv.DistrictName, rv.BlockNameEng, m.mobile_no, m.alternate_mobile_no, m.email_id, m.circle_name, m.subdistrict_code,
    rv.subdistrict_code
    FROM users u 
    INNER JOIN mas_raeo m ON m.user_id = u.user_id
    INNER JOIN mas_block rv ON rv.subdistrict_code = u.subdistrict_code
    WHERE u.usertype IN (5,15) AND u.district_id = ?
    GROUP BY u.user_id`,
        p = [district_id];
    return { "query": q, "params": p };
}
exports.getBlockByDistrictQueryParamObj = function (district_id) {
    let q = `SELECT b.BlockCode AS block_id,  b.subdistrict_code  , b.BlockNameHin AS block_name, b.BlockNameEng AS block_name_en
            FROM mas_block b
            WHERE b.district_id = ?`;
    return ({ query: q, params: [district_id] });
};
exports.getOfficerListByDistrictIdQueryParamObj = function (district_id, block, type, search) {
    let whereObj = '';
    if (search != '') {
        if (type == 1) {
            whereObj += `AND m.user_id = ${search}`
        }
        else {
            whereObj += `AND m.mobile_no = ${search}`
        }
    }
    else {
        if (block != '-1') {
            whereObj += `AND m.subdistrict_code = ${block}`
        }
    }
    let q = `SELECT m.user_id, m.name, m.mobile_no, m.alternate_mobile_no, m.subdistrict_code, m.circle_name, 
    rb.BlockNameHin AS block_name, COUNT(ov.village_code) AS village_count
    FROM mas_raeo m
    inner JOIN rev_block rb ON rb.subdistrict_code = m.subdistrict_code
    left JOIN officer_village_details ov ON ov.officer_code = m.user_id
    WHERE m.district_id = ? AND m.user_type = 6 ${whereObj}
    GROUP BY m.user_id `
    return ({ query: q, params: [+district_id] });
}

exports.getAllCOOPBanksQandP = function () {
    return ({
        query: `SELECT mcb.c_bank_code, mcb.c_bank_name, mcb.bankcode from mas_cooperative_bank mcb
        WHERE mcb.district_id IS NOT null `, params: []
    })
};
exports.getMasDivisonQueryParam = function () {
    return ({
        query: `SELECT md.div_id, md.division_name_hi, md.division_name_en 
        FROM mas_divisions md `, params: []
    })
};
exports.getSubDistrictListByDistQPObj = function (dist_LGD_Code) {
    return ({
        query: `SELECT ms.subdistrict_code, ms.subdistrict_name FROM mas_subdistricts ms
        WHERE ms.district_code = ?`, params: [+dist_LGD_Code]
    })
}
exports.getSubDistrictListByDistIdQPObj = function (dist_id) {
    return ({
        query: `SELECT ms.subdistrict_code, ms.subdistrict_name, ms.district_name FROM mas_subdistricts ms
        INNER JOIN mas_districts md ON md.LGD_Code = ms.district_code
        WHERE md.District_ID = ?`, params: [+dist_id]
    });
}