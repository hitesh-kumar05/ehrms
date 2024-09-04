

var getMenuByUserQueryParamObj = function (user_type) {
    var q = `SELECT m.menuCode, m.name, m.route, m.children, m.icon, m.usertype, m.mainmenuCode,m.menuOrder,m.is_new FROM mas_menu m WHERE m.usertype = ? AND m.is_active = 1
    ORDER BY m.menuOrder ;`;
    var p = [user_type];
    return ({ query: q, params: p });
};

var getAllDistrictQueryParamObj = function () {
    var q = `SELECT cast(d.District_ID as signed) as district_id ,d.District_Name, d.District_Name_Eng,d.LGD_Code FROM mas_districts d
            ORDER BY d.District_Name_Eng`;
    var p = [];
    return ({ query: q, params: p });
};

var getBlockByDistrictQueryParamObj = function (district_id) {
    var q = `SELECT b.BlockCode AS block_id,  b.subdistrict_code  , b.BlockNameHin AS block_name, b.BlockNameEng AS block_name_en
            FROM mas_block b
            WHERE b.district_id = ?`;
    var p = [district_id];
    return ({ query: q, params: p });
};

exports.getVillageListBySubdistrict = function (subdistrict_code) {
    let q = `SELECT d.villcdname, d.vsr_census, d.halka FROM mas_villages d
    WHERE d.subdistrictcode_census = ?
    ORDER BY d.villcdname`
    let p = [subdistrict_code]
    return ({ query: q, params: p });
}

var getTehsilByDistrictQueryParamObj = function (district_id) {
    var q = `SELECT t.Tehsil_ID AS tehsil_id, t.Tehsil_Name AS tehsil_name, t.Tehsil_Name_En AS tehsil_name_en,
                t.CensusCode AS census_code
                FROM mas_tehsil t
                WHERE t.District_ID = ?;`
    // var q = `SELECT t.Rev_teh_id AS tehsil_id, t.Tehsil_Name AS tehsil_name, t.Tehsil_Name_En AS tehsil_name_en,
    //             t.CensusCode AS census_code
    //             FROM mas_tehsil t
    //             WHERE t.Rev_dist_id = ?`;
    var p = [district_id];
    return ({ query: q, params: p });
};

var getVillageByDistrictAndTehsilQueryParamObj = function (district_id, tehsil_id) {
    var q = `SELECT * FROM mas_villages d
INNER JOIN mas_tehsil mt
ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
WHERE mt.District_ID = ? AND mt.Tehsil_ID = ? 
ORDER BY d.villcdname;`
    //     var q = `SELECT * FROM mas_villages d
    // WHERE d.distno = ? AND d.tehsilno = ?
    // ORDER BY d.villcdname`;
    var p = [district_id, tehsil_id];
    return ({ query: q, params: p });
};

var getRGVillageByDistrictAndTehsilQueryParamObj = function (district_id, tehsil_id) {
    var q = `SELECT * FROM mas_villages d
INNER JOIN mas_tehsil mt
ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
WHERE mt.District_ID = ? AND mt.Tehsil_ID = ? AND d.VillType = 'R'
ORDER BY d.villcdname;`
    //     var q = `SELECT * FROM mas_villages d
    // WHERE d.distno = ? AND d.tehsilno = ?
    // ORDER BY d.villcdname`;
    var p = [district_id, tehsil_id];
    return ({ query: q, params: p });
};

var getForestVillageByDistrictAndTehsilQueryParamObj = function (district_id, tehsil_id) {
    var q = `SELECT * FROM mas_villages d
INNER JOIN mas_tehsil mt
ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
WHERE mt.District_ID = ? AND mt.Tehsil_ID = ? and d.VillType = 'F'
ORDER BY d.villcdname;`
    //     var q = `SELECT * FROM distno d
    // WHERE d.distno = ? AND d.tehsilno = ? and d.VillageID = 'Vangram'
    // ORDER BY d.villcdname`;
    var p = [district_id, tehsil_id];
    return ({ query: q, params: p });
};

var getAllBanksQueryParamObj = function () {
    var q = `SELECT * FROM mas_bank mb
ORDER BY mb.bank_name`;
    var p = [];
    return ({ query: q, params: p });
};

var getBankBranchByDistrictAndBankQueryParamObj = function (district_id, bank_id) {
    var q = `SELECT * FROM mas_bankbranch mbb 
    WHERE mbb.branch_name <> 'OTHER STATE' AND mbb.branch_code NOT IN (152151, 155111) AND mbb.bank_code = ? AND mbb.district_code = ?
    ORDER BY mbb.branch_name`;
    var p = [bank_id, district_id];
    return ({ query: q, params: p });
};

var getVillageListBySocietyQueryParamObj = function (society_id) {
    var q = `SELECT DISTINCT cast(s.Newvulocation as signed) AS 'village_code' , s.vlocationname AS 'village_name' , 
s.vsrcensus, d.VillageID
    FROM society_details_mapped s
    INNER JOIN mas_villages d ON d.vsr_census = s.Newvulocation
    WHERE s.Society_Id = ?;`;
    var p = [society_id];
    return ({ query: q, params: p });
};

exports.getVillageListByTehsilQueryParamObj = (district_id, tehsild_id) => {
    var q = `SELECT m.villcdname, m.vsr_census, m.VillageID, m.halka
    FROM mas_villages m
    INNER JOIN mas_tehsil t ON t.Rev_dist_id = m.distno AND t.Rev_teh_id = m.tehsilno
    WHERE t.District_ID = ? AND t.Tehsil_ID = ?
    ORDER BY m.villcdname;`
    var p = [district_id, tehsild_id]
    return ({ query: q, params: p });
}


exports.getVillageListForRaeo = (raeo_id) => {
    var q = `SELECT m.villcdname as village_name, m.vsr_census as village_code, m.VillageID, m.halka
    FROM officer_village_details ofv 
    INNER join mas_villages m ON m.vsr_census = ofv.village_code
    WHERE ofv.officer_code = ?
    ORDER BY m.villcdname;`
    var p = [raeo_id]
    return ({ query: q, params: p });
}

exports.getVillageListByDistrictTehsilID = (DistrictTehsilID) => {
    var q = `SELECT m.villcdname, m.vsr_census, m.VillageID, m.halka
    FROM mas_villages m
    INNER JOIN mas_tehsil t ON t.Rev_dist_id = m.distno AND t.Rev_teh_id = m.tehsilno
    WHERE t.DistrictTehsilID = ?
    ORDER BY m.villcdname;`
    var p = [+DistrictTehsilID]
    return ({ query: q, params: p });
}

exports.getSocietyListByTehsilQueryParamObj = (district_id, tehsild_id) => {
    var q = `SELECT s.Society_Id, s.Society_Name FROM society s 
    WHERE s.District_Id = ? AND s.Block_Id = ?;`
    var p = [district_id, tehsild_id]
    return ({ query: q, params: p });
}

exports.getPanjiyanListBygender_DistrictWiseQueryParamObj = (district_id, tehsild_id) => {
    let q = `SELECT md.District_ID,md.District_Name, count(distinct(fs.uf_id)),
COUNT(DISTINCT(case when mf.gender = 'M' then  fs.uf_id  END )) AS count_male_d,
COUNT(DISTINCT(case when mf.gender = 'F' then  fs.uf_id  END )) AS count_female_d,
COUNT(DISTINCT(case when mf.gender IN ('O','T') then  fs.uf_id  END )) AS count_other_d,
COUNT(1) AS fs_id,
sum(case when mf.gender = 'M' then 1 ELSE 0 END ) AS count_male,
sum(case when mf.gender = 'F' then 1 ELSE 0 END ) AS count_female,
sum(case when mf.gender IN ('O','T') then 1 ELSE 0 END ) AS count_other

 FROM farmer_society fs
 INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
INNER JOIN society s ON s.Society_Id = fs.society_id
INNER JOIN mas_districts md ON md.District_ID = s.District_Id
GROUP BY md.District_ID 
ORDER BY md.District_Name_Eng`;
    return ({ query: q, params: [] });
}

var getAllCropQyeryParamObj = function () {
    return ({ query: `SELECT mc.crop_code, mc.crop_name_hi,mc.crop_categories_code, mc.crop_name_en FROM mas_crop mc `, params: [] })
}

let getMasRelationQueryParamObj = function () {
    let q = `SELECT * from mas_relation mr 
    WHERE mr.is_active = 1`;
    return ({ query: q, params: [] });
}

let getMasCasteQueryParamObj = function () {
    let q = `SELECT DISTINCT c.caste_code, c.caste_name FROM mas_caste c
ORDER BY c.caste_code desc ;`;
    return ({ query: q, params: [] });
}

let getMasSubCasteQueryParamObj = function (caste_code) {
    let q = `SELECT c.subcaste_code, c.subcaste_name FROM mas_caste c
    WHERE c.caste_code = ?
    ORDER BY c.subcaste_code desc`;
    let p = [caste_code];
    return ({ query: q, params: p });
}

let getcheckFarmerExistWithAadharQueryParamObj = function (aadharNo, uf_id) {
    let where_clause = ``;

    if (uf_id && uf_id != -1) {
        where_clause += ` AND mf.uf_id NOT IN (${uf_id}) `;
    }
    // console.log(uf_id, where_clause, "Query");
    let q = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.relation, mf.father_name, 
    mf.dob, mf.category, mf.subcategory AS subcaste_code,
    mf.gender, mf.mobile_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, mf.uf_id, fs.fs_id, 
    fs.bank_code, dd.District_ID AS bank_district, CAST(fs.branch_code AS INT) AS branch_code, CAST(mf.village_code AS INT) AS village_code, 
    mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
    mb.bank_name, mbb.branch_name, dd.District_Name AS bank_district_name, fs.society, s.Society_Name AS 'society_name', dd.LGD_Code, mf.aadhar_verification
   FROM mas_farmer mf
   INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
   INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
   INNER JOIN mas_tehsil mt
   ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
   Left JOIN mas_bank mb ON mb.bank_code = fs.bank_code
   Left JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
   Left JOIN mas_districts dd ON dd.LGD_Code = mbb.district_code
   Left JOIN society s ON fs.society = s.Society_Id
    WHERE mf.aadhar_number = ? AND (fs.carry_forward_status IS null OR fs.carry_forward_status IN ('R') ) ${where_clause}`;
    let p = [+aadharNo];
    return ({ query: q, params: p });
}

let checkAadharExistForSocietyInFarmerRepresentativeQPObj = function (aadharNo, society) {
    let q = `SELECT COUNT(*) as count FROM farmerrepresentative f
    WHERE f.AadharNo = ? AND f.society = ?`;
    let p = [+aadharNo, +society];
    return ({ query: q, params: p });
}

let getMaxNomineeCount = function () {
    let q = `SELECT * FROM app_configuration ac WHERE ac.key = "max_nominee_count";`;
    return { query: q, params: [] };

}

let getCheckFarmerExistOnNewDBAadhar = function (aadharNo, uf_id) {
    let where_clause = ``;

    if (uf_id && uf_id != -1) {
        where_clause += ` AND mf.uf_id NOT IN (${uf_id}) `;
    }

    let q = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.relation, mf.father_name, mf.dob, 
    mc.caste_code as category, mf.subcaste_code AS subcaste_code,
        mf.gender, mf.mobile_no, fs.membership_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, mf.uf_id, fs.fs_id, 
       mbb.bank_code as bank_code, dd.District_ID AS bank_district, CAST(fs.branch_code AS INT) AS branch_code, CAST(mf.village_code AS INT) AS village_code, 
        mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
        mb.bank_name, mbb.branch_name, dd.District_Name AS bank_district_name, fs.society_id AS society, s.Society_Name AS 'society_name', dd.LGD_Code, mf.aadhar_verification
       FROM mas_farmer mf
       INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
       INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
       INNER JOIN mas_tehsil mt ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
       INNER JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
       INNER JOIN mas_bank mb ON mb.bank_code = mbb.bank_code
       INNER JOIN mas_districts dd ON dd.LGD_Code = mbb.district_code
       INNER JOIN society s ON fs.society_id = s.Society_Id
       INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
        WHERE mf.aadhar_number = ? ${where_clause}`;
    let p = [aadharNo];
    return ({ query: q, params: p });
}

exports.getLandDataFromUfp_2022QueryParamObj = (village_code, khasra_str) => {
    return ({
        query: `SELECT ld.village_code,ld.khasra_no, ld.OwnerName, mv.villcdname,ld.area
 FROM land_details ld
 INNER JOIN mas_villages mv ON mv.vsr_census = ld.village_code
 WHERE ld.village_code = ? AND ld.khasra_no IN (${khasra_str})`, params: [village_code]
    })
}

exports.getCropDataFromUfp_2022QueryParamObj = (village_code, khasra_str) => {
    return ({
        query: `SELECT cd.village_code,cd.khasra_no, cd.crop_code,mc.crop_name,cd.ccrop_area AS crop_area
 FROM crop_details cd
 INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code
 WHERE cd.village_code = ? AND cd.khasra_no IN (${khasra_str})`, params: [village_code]
    })
}

exports.getCropDataFromUfp_2023QueryParamObj = (village_code, khasra_str) => {
    return ({
        query: `SELECT cd.village_code,cd.khasra_no, cd.crop_code,mc.crop_name,cd.crop_area
 FROM crop_details cd
 INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code
 WHERE cd.village_code = ? AND cd.khasra_no IN (${khasra_str})`, params: [village_code]
    })
}

exports.getGirdawariDataFromUfp_2022QueryParamObj = (village_code, khasra_str) => {
    return ({
        query: `SELECT g.VillageLGCode AS village_code, g.KhasraNo AS khasra_no, g.SubCropCode AS crop_code ,
         mc.crop_name_hi AS crop_name, g.CropArea AS crop_area FROM girdawari_2022.girdawari_complete_19052023 g 
INNER JOIN mas_crop mc
ON mc.crop_code = g.SubCropCode WHERE  g.VillageLGCode = ? AND g.KhasraNo IN (${khasra_str})`, params: [village_code]
    })
}

exports.getLandDataFromUfp_2023QueryParamObj = (village_code, khasra_str) => {
    return ({
        query: `SELECT ld.village_code,ld.khasra_no, ld.OwnerName, mv.villcdname,ld.land_area
    FROM land_details ld
    INNER JOIN mas_villages mv ON mv.vsr_census = ld.village_code
    WHERE ld.village_code = ? AND ld.khasra_no IN (${khasra_str})`, params: [village_code]
    })
}

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

exports.getMasDivisonQueryParam = function () {
    return ({
        query: `SELECT md.div_id, md.division_name_hi, md.division_name_en 
        FROM mas_divisions md `, params: []
    })
}

exports.getAllCOOPBanksQandP = function () {
    return ({
        query: `SELECT mcb.c_bank_code, mcb.c_bank_name, mcb.bankcode from mas_cooperative_bank mcb
        WHERE mcb.district_id IS NOT null `, params: []
    })
}

exports.getDistrictListForBankQandP = function (bank_id) {
    return ({
        query: `SELECT md.District_ID, md.District_Name, md.District_Name_Eng FROM mas_cooperative_bank_district mc
        INNER JOIN mas_districts md ON md.District_ID = mc.district_id
        WHERE mc.c_bank_code = ?`, params: [+bank_id]
    })
}

exports.getFreeVillagesByDistAndTehsilQandP = function (district_id, tehsil_id) {
    return ({
        query: `SELECT mv.vsr_census, mv.villcdname, mv.VillageID, mv.VillType ,mv.halka, mv.distno, mv.tehsilno FROM mas_villages mv
        INNER JOIN mas_tehsil mt ON mv.distno = mt.Rev_dist_id AND mv.tehsilno = mt.Rev_teh_id
        WHERE mt.District_ID = ? AND mt.Tehsil_ID = ?
        AND NOT EXISTS (SELECT m.vsrcensus FROM society_details_mapped m
        WHERE mv.vsr_census = m.vsrcensus);`, params: [+district_id, tehsil_id]
    })
}

exports.getPurchaseCenterListBySocietyQandP = function (society_id) {
    return ({
        query: `SELECT mp.PurchaseCEnter_Id, mp.PurchaseCenter_Name, mp.PurchaseCenter_Name_Eng 
        FROM mas_purchase_center mp
        WHERE mp.Society_Code = ?`, params: [+society_id]
    })
}

exports.getAadharDetailsByFsidQandP = function (fs_id) {
    return ({
        query: `SELECT CAST(mf.aadhar_number AS CHAR) as aadhar_number, mf.aadhar_verification, mf.farmer_name_aadhar, mf.uf_id, 
        fs.farmer_code, mf.farmer_name_hi,
                mf.father_name, mf.mobile_no, s.Society_Name, mv.villcdname, mv.halka, mv.tehcdname, mv.cdname, 
                  mf.gender, mf.relation, mf.subcaste_code, mc.caste_code, mf.address, mf.mobile_no, mf.dob, fs.village_code 
                FROM farmer_society fs
                INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
                INNER JOIN raeo_sanshodhan_verification rsv ON fs.fs_id = rsv.fs_id
                INNER JOIN society s ON s.society_id = fs.society_id
        INNER JOIN mas_villages mv ON mv.vsr_census = mf.village_code
        INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
        WHERE fs.fs_id = ? AND rsv.edit_type_adhar_status = 1`, params: [+fs_id]
    })
}

exports.checkAadharForExistOnNewDB = function (aadhar_no, uf_id) {
    return ({
        query: `SELECT CAST(mf.aadhar_number AS CHAR) as aadhar_number, mf.aadhar_verification, mf.farmer_name_aadhar, mf.uf_id,
        mf.farmer_name_hi
                FROM mas_farmer mf
                WHERE mf.aadhar_number = ? AND mf.uf_id NOT IN (?)`, params: [+aadhar_no, +uf_id]
    })
}

exports.checkAadharForExistOnOldDB = function (aadhar_no, uf_id) {
    return ({
        query: `SELECT CAST(mf.aadhar_number AS CHAR) as aadhar_number, mf.aadhar_verification, mf.farmer_name_aadhar, mf.uf_id,
        mf.farmer_name_hi
                FROM mas_farmer mf
                INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
                WHERE mf.aadhar_number = ? AND mf.uf_id NOT IN (?)
                AND ( fs.carry_forward_status NOT IN ('D') OR fs.carry_forward_status IS NULL )`, params: [+aadhar_no, +uf_id]
    })
}

exports.getFarmerBasicDetailQueryParamObj = function (fs_id) {

    let q = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number, mf.farmer_name_aadhar, mf.farmer_name_hi, 
    mf.relation, mf.father_name, mf.dob, 
    mc.caste_code as category, mf.subcaste_code AS subcaste_code,
        mf.gender, mf.mobile_no, fs.membership_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, 
        mf.uf_id, fs.fs_id, 
       mbb.bank_code as bank_code, dd.District_ID AS bank_district, CAST(fs.branch_code AS INT) AS branch_code, 
       CAST(mf.village_code AS INT) AS village_code, 
        mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
        mb.bank_name, mbb.branch_name, dd.District_Name AS bank_district_name, fs.society_id, s.Society_Name AS 'society_name', dd.LGD_Code,
        fr.TypeofPerson AS nominee_type, fr.Name AS nominee_name, mr.rel_name AS nominee_relation, fr.AadharNo AS nominee_aadhar, fs.farmer_code,
        fs.entry_type_code,IFNULL(fs.updated_dtstamp, fs.dtstamp) AS dtstamp, fs.is_update, d.villcdname, d.tehcdname, d.cdname, d.halka,  mc.caste_name, mc.subcaste_name,
        mv.villcdname AS 'society_village', fs.village_code AS society_village_code
       FROM mas_farmer mf
       INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
       INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
       INNER JOIN mas_tehsil mt ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
       INNER JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
       INNER JOIN mas_bank mb ON mb.bank_code = mbb.bank_code
       INNER JOIN mas_districts dd ON dd.LGD_Code = mbb.district_code
       INNER JOIN society s ON fs.society_id = s.Society_Id
       INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
       INNER JOIN farmerrepresentative fr ON fr.fs_id = fs.fs_id
       INNER JOIN mas_relation mr ON fr.Relation = mr.rel_id
       INNER JOIN mas_villages mv ON mv.vsr_census = fs.village_code
        WHERE fs.fs_id = ?`;

    let p = [fs_id];
    return ({ query: q, params: p });
}

exports.getFoodDistrictByVillageQandP = function (village_code) {
    let q = `SELECT md.* FROM mas_villages mv
    INNER JOIN mas_districts md ON mv.distno = md.Rev_district_id
    WHERE mv.vsr_census = ?`,
        p = [village_code];
    return { "query": q, "params": p }
}

exports.getFarmerBasicDetailFromNewDBQueryParamObj = function (type, serach) {
    let where_clause = ``;
    if (type == 1) {
        where_clause += `mf.aadhar_number = ${serach}`;
    }
    else if (type == 2) {
        where_clause += `fs.uf_id = ${serach}`;
    }
    else if (type == 3) {
        where_clause += `fs.farmer_code = '${serach}'`;
    }


    let q = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.relation, mf.father_name, mf.dob, 
    fs.old_fs_id, fs.farmer_code,
    mc.caste_code as category, mf.subcaste_code AS subcategory,
        mf.gender, mf.mobile_no, fs.membership_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, mf.uf_id, fs.fs_id,
       mbb.bank_code as bank_code, dd.District_ID AS bank_district, CAST(fs.branch_code AS INT) AS branch_code, CAST(mf.village_code AS INT) AS village_code, 
        mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
        mb.bank_name, mbb.branch_name, dd.District_Name AS bank_district_name, fs.society_id AS 'society', s.Society_Name AS 'society_name', dd.LGD_Code, d.villcdname , d.halka,d.tehcdname,d.cdname,
        fr.TypeofPerson AS nominee_type, fr.Name AS nominee_name, mr.rel_id AS nominee_relation, fr.AadharNo AS nominee_aadhar_number,fs.village_code AS 'society_village_code'
       FROM mas_farmer mf
       INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
       INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
       INNER JOIN mas_tehsil mt ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
       INNER JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
       INNER JOIN mas_bank mb ON mb.bank_code = mbb.bank_code
       INNER JOIN mas_districts dd ON dd.LGD_Code = mbb.district_code
       INNER JOIN society s ON fs.society_id = s.Society_Id
       INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
       INNER JOIN farmerrepresentative fr ON fr.fs_id = fs.fs_id
       INNER JOIN mas_relation mr ON fr.Relation = mr.rel_id
        WHERE ${where_clause} `;

    let p = [];
    return ({ query: q, params: p });
}

exports.getFarmerLandDetailsFromNewDBQueryParamObj = function (type, serach) {

}

exports.getSocietyListByDistrictIdQandPObj = function (district_id) {
    let q = `SELECT s.Society_Id, s.Society_Name FROM society s
    WHERE s.District_Id = ?;`,
        p = [district_id];
    return ({ query: q, params: p });
}

exports.getRequestedFarmerListFromPermissionTable = function (offset, size) {
    let q = `SELECT s.Society_Name,u.username AS 'requested_user_name',nrp.aadhar_number,nrp.society_id,nrp.is_approved, nrp.approved_date, nrp.letter_no,nrp.dtstamp AS 'requested_date' FROM new_reg_permission nrp
INNER JOIN society s ON s.Society_Id = nrp.society_id
LEFT JOIN users u ON u.user_id = nrp.request_user_id
WHERE nrp.is_completed IS null
order by nrp.dtstamp
LIMIT ?,?`;
    let p = [offset, size]
    return ({ query: q, params: p });
}

exports.getRequestedOldFarmerFromPermissionTableQueryParamObj = function (offset, size) {
    let q = `SELECT  s.Society_Name,mf.farmer_name_hi, mf.father_name,mf.uf_id,cp.farmer_code,
cp.society_id,cp.approved_date, cp.is_approved, cp.dtstamp AS 'requested_date', cp.letter_no,cp.reg_type
 FROM carryforward_permission cp
INNER JOIN society s ON s.Society_Id = cp.society_id
-- INNER JOIN farmer_society fs ON fs.uf_id = cp.uf_id AND fs.society =cp.society_id
INNER JOIN mas_farmer mf ON mf.uf_id = cp.uf_id 
WHERE cp.is_completed IS null
order by cp.dtstamp
LIMIT ?,?`;
    let p = [offset, size]
    return ({ query: q, params: p });
}

exports.getNewPermissableFarmerListFromPermissionTable = function (user_id, offset, size) {
    let q = `SELECT CAST(nrp.aadhar_number AS CHAR) AS aadhar_number,nrp.letter_no, nrp.society_id, nrp.dtstamp, nrp.is_approved, nrp.approved_date ,s.Society_Name FROM new_reg_permission nrp
INNER JOIN society s ON s.Society_Id = nrp.society_id
INNER JOIN users u ON s.District_Id = u.district_id AND s.Block_Id = u.tehsil_id
WHERE nrp.is_completed IS NULL AND u.user_id = ?
order by nrp.dtstamp;`;
    let p = [user_id, offset, size]
    return ({ query: q, params: p });
}

exports.isLastDateExceededQueryParamObj = (user_id) => {
    let q = `SELECT u.user_id, 
    max(if(a.key = 2, a.value, (SELECT value FROM app_configuration WHERE id=2))) AS registration_last_date,
     Max(if(a.key = 3, a.value, (SELECT value FROM app_configuration WHERE id=3))) AS carry_last_date,
      max(if(a.key = 4, a.value, (SELECT value FROM app_configuration WHERE id=4))) AS edit_last_date,
       max(if(a.key = 5, a.value, (SELECT value FROM app_configuration WHERE id=5))) AS ganna_last_date,
     NOW() AS today
    from users u
INNER JOIN mas_user_type mu
ON mu.usertype = u.usertype
LEFT JOIN app_configuration_special a ON a.user_id = u.user_id AND a.is_active = 1
WHERE u.user_id = ?
GROUP BY a.user_id`
    let p = [user_id]
    return { query: q, params: p }
}

module.exports.getAllDistrictQueryParamObj = getAllDistrictQueryParamObj;
module.exports.getMenuByUserQueryParamObj = getMenuByUserQueryParamObj;
module.exports.getBlockByDistrictQueryParamObj = getBlockByDistrictQueryParamObj;
module.exports.getTehsilByDistrictQueryParamObj = getTehsilByDistrictQueryParamObj;
module.exports.getVillageByDistrictAndTehsilQueryParamObj = getVillageByDistrictAndTehsilQueryParamObj;
module.exports.getRGVillageByDistrictAndTehsilQueryParamObj = getRGVillageByDistrictAndTehsilQueryParamObj;
module.exports.getAllBanksQueryParamObj = getAllBanksQueryParamObj;
module.exports.getBankBranchByDistrictAndBankQueryParamObj = getBankBranchByDistrictAndBankQueryParamObj;
module.exports.getAllCropQyeryParamObj = getAllCropQyeryParamObj;//
module.exports.getForestVillageByDistrictAndTehsilQueryParamObj = getForestVillageByDistrictAndTehsilQueryParamObj;
module.exports.getMasRelationQueryParamObj = getMasRelationQueryParamObj;
module.exports.getMasCasteQueryParamObj = getMasCasteQueryParamObj;
module.exports.getMasSubCasteQueryParamObj = getMasSubCasteQueryParamObj;
module.exports.getcheckFarmerExistWithAadharQueryParamObj = getcheckFarmerExistWithAadharQueryParamObj;
module.exports.getVillageListBySocietyQueryParamObj = getVillageListBySocietyQueryParamObj;
module.exports.checkAadharExistForSocietyInFarmerRepresentativeQPObj = checkAadharExistForSocietyInFarmerRepresentativeQPObj;
//module.exports.getOldCropDetailsQueryParamObj = getOldCropDetailsQueryParamObj;
module.exports.getMaxNomineeCount = getMaxNomineeCount;
module.exports.getCheckFarmerExistOnNewDBAadhar = getCheckFarmerExistOnNewDBAadhar;