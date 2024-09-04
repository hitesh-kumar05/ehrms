const { query } = require("express");

exports.panjiyanReportQueryParamObj = (args) => {
    //console.log(args);
    let where_clause = ``, select_statement = `select `;
    if (args['society_id']) {
        // Action for society 
        select_statement = `SELECT v.villcdname name, v.VillType, `
        where_clause = ` WHERE s.Society_Id = ${args['society_id']} GROUP BY r.village_code;`

    } else if (args['district_id'] && args['tehsil_id']) {
        // Action for tehsil
        select_statement = `SELECT s.Society_Name name,s.District_Id, s.Block_Id, s.Society_Id, `
        where_clause = ` WHERE s.District_Id = ${args['district_id']} AND s.Block_Id = ${args['tehsil_id']} GROUP BY s.Society_Id;`
    } else if (args['district_id']) {
        // Action for district
        select_statement = `SELECT t.Tehsil_Name name, s.District_Id, s.Block_Id, `
        where_clause = ` WHERE s.District_Id = ${args['district_id']} GROUP BY t.DistrictTehsilID;`
    } else if (args['div_id']) {
        // Action for div
        select_statement = ` SELECT d.District_Name name,s.District_Id,  `
        where_clause = ` WHERE d.div_id = ${args['div_id']} GROUP BY s.District_Id;`
    } else if (args['block_id']) {
        // Action for block
        select_statement = `SELECT s.Society_Name name, s.District_Id, s.Block_Id, s.Society_Id, `
        where_clause = ` WHERE t.subdistrict_code = ${args['block_id']} GROUP BY s.Society_Id;`
    }
    else if (args['bank_code']) {
        select_statement = `SELECT d.District_Name name, d.District_Id, `
        where_clause = ` INNER JOIN mas_cooperative_bank_district bb ON bb.district_id = s.District_Id WHERE bb.c_bank_code = ${args['bank_code']} GROUP BY s.District_Id`
    }
    else {
        // state
        select_statement = `SELECT d.District_Name name, d.District_Id, `
        where_clause = ` GROUP BY s.District_Id`
    }
    let q = `${select_statement} 
SUM(r.total_cf)  total_cf, SUM(r.old_cf) old_cf, SUM(r.old_deleted) old_deleted, SUM(r.old_request) old_request,
SUM(r.cf) cf, SUM(r.nf) nf, SUM(r.society_sf) society_sf, SUM(r.tehsil_sf) tehsil_sf, SUM(r.vf) vf,
SUM(r.new_request) new_request, SUM(r.new_deleted) new_deleted, SUM(r.raeo_nf) raeo_nf,
SUM(r.raeo_sf) raeo_sf, SUM(raeo_rf) raeo_rf
FROM procurement_2024.panjiyan_report r
INNER JOIN society s ON s.Society_Id = r.society_id
INNER JOIN mas_districts d ON d.District_ID = s.District_Id
INNER JOIN mas_tehsil t ON t.District_ID = s.District_Id AND t.Tehsil_ID = s.Block_Id
INNER JOIN mas_villages v ON v.vsr_census = r.village_code
INNER JOIN mas_divisions dd ON dd.div_id = d.div_id 
INNER JOIN mas_block b ON b.subdistrict_code = t.subdistrict_code
${where_clause}`
    return ({ query: q, params: [] });
}

exports.raeoVarificationReportQueryParamObj = (args) => {
    let where_clause = ``, select_statement = `select `;
    if (args.officer_code) {
        select_statement = 'SELECT s.Society_Name, v.villcdname as name, '
        where_clause = `WHERE o.department_code = 2 AND o.officer_code=${where_clause} GROUP BY v.vsr_census`
    } else if (args['district_id'] && args['tehsil_id']) {
        // Action for tehsil
        select_statement = `SELECT s.Society_Name name,s.District_Id, s.Block_Id, s.Society_Id, `
        where_clause = ` WHERE s.District_Id = ${args['district_id']} AND s.Block_Id = ${args['tehsil_id']} GROUP BY s.Society_Id;`
    } else if (args['district_id']) {
        // Action for district
        select_statement = `SELECT t.Tehsil_Name name, s.District_Id, s.Block_Id, `
        where_clause = ` WHERE s.District_Id = ${args['district_id']} GROUP BY t.DistrictTehsilID;`
    } else if (args['div_id']) {
        // Action for div
        select_statement = ` SELECT d.District_Name name,s.District_Id,  `
        where_clause = ` WHERE d.div_id = ${args['div_id']} GROUP BY s.District_Id;`
    } else if (args['block_id']) {
        // Action for block
        select_statement = `SELECT s.Society_Name name, s.District_Id, s.Block_Id, s.Society_Id, `
        where_clause = ` WHERE t.subdistrict_code = ${args['block_id']} GROUP BY s.Society_Id;`
    } else if (args['bank_code']) {
        select_statement = `SELECT d.District_Name name, d.District_Id, `
        where_clause = ` INNER JOIN mas_cooperative_bank_district bb ON bb.district_id = s.District_Id WHERE bb.c_bank_code = ${args['bank_code']} GROUP BY s.District_Id`
    } else if (args['society_id']) {
        // Action for society 
        select_statement = `SELECT v.villcdname name, v.VillType, `
        where_clause = ` WHERE s.Society_Id = ${args['society_id']} GROUP BY r.village_code;`
    } else {
        select_statement = `SELECT s.District_Id, d.District_Name AS name, `
        where_clause = `GROUP BY s.District_Id`
    }

    let q = `${select_statement} SUM(r.nf) nf, SUM(r.society_sf) society_sf, SUM(r.tehsil_sf) tehsil_sf, 
SUM(r.raeo_nf) raeo_nf, SUM(r.raeo_sf) raeo_sf, SUM(r.raeo_rf) raeo_rf
FROM officer_village_details o 
INNER JOIN panjiyan_report r ON r.village_code = o.village_code and o.department_code = 2
INNER JOIN society s ON s.Society_Id = r.society_id
INNER JOIN mas_districts d ON d.District_ID = s.District_Id
INNER JOIN mas_tehsil t ON t.District_ID = s.District_Id AND t.Tehsil_ID = s.Block_Id
INNER JOIN mas_villages v ON v.vsr_census = r.village_code
${where_clause}`
    console.log(q);
    return ({ query: q, params: [] })
}

exports.cropPanjiyanReportQueryParamObj = (args) => {
    let where_clause = ``
    if (args['society_id']) {
        where_clause = ` WHERE s.Society_Id = ${args['society_id']}`
    } else if (args['district_id'] && args['tehsil_id']) {
        where_clause = `  WHERE s.District_Id = ${args['district_id']} AND s.Block_Id = ${args['tehsil_id']}`
    } else if (args['district_id']) {
        where_clause = ` WHERE s.District_Id = ${args['district_id']}`
    } else if (args['div_id']) {
        where_clause = ` WHERE d.div_id = ${args['div_id']}`
    } else if (args['block_id']) {
        where_clause = ` WHERE t.subdistrict_code = ${args['block_id']}`
    } else if (args['bank_code']) {
        where_clause = ` INNER JOIN mas_cooperative_bank_district bb ON bb.district_id = s.District_Id WHERE bb.c_bank_code = ${args['bank_code']}`
    } else {
        where_clause = ``
    }
    let q = `SELECT js.name,  IFNULL(cp.old_area, 0) AS old_area, 
    IFNULL(cp.old_fs, 0) AS old_fs, 
    IFNULL(cp.new_area, 0) AS new_area, 
    IFNULL(cp.new_fs, 0) AS new_fs, 
    IFNULL(cp.total_area, 0) AS total_area,
    IFNULL(cp.total_fs, 0) AS total_fs FROM mas_crop_category_js js 
             LEFT JOIN (
             SELECT cp.id, 
             SUM(ifnull(cp.old_area, 0)) old_area, SUM(ifnull(cp.old_fs, 0)) old_fs, SUM(ifnull(cp.new_area, 0)) new_area, SUM(ifnull(cp.new_fs, 0)) new_fs, SUM(ifnull(cp.total_area, 0)) total_area,
             SUM(ifnull(cp.total_fs, 0)) total_fs
             FROM crop_panjiyan_report cp
             INNER JOIN society s ON s.Society_Id = cp.Society_Id
             INNER JOIN mas_districts d ON d.District_ID = s.District_Id
             INNER JOIN mas_tehsil t ON t.District_ID = s.District_Id AND t.Tehsil_ID = s.Block_Id
             ${where_clause} GROUP BY cp.id) cp ON cp.id = js.id`
    return ({ query: q, params: [] });
}

exports.panjiyanListQueryParamObj = (args) => {
    const from = args['page'] * args.size;
    const to = args.size
    let where_clause = ``
    if (args.search_value) {
        if (args.search_value.length == 7) {
            where_clause = ` AND fs.uf_id = ${args.search_value}`
        } else {
            where_clause = ` AND fs.farmer_code = ${args.search_value}`
        }
    }
    else if (args['society_id']) {
        where_clause = ` AND s.Society_Id = ${args['society_id']}`
    } else if (args['district_id'] && args['tehsil_id']) {
        where_clause = `  AND s.District_Id = ${args['district_id']} AND s.Block_Id = ${args['tehsil_id']}`
    } else if (args['district_id']) {
        where_clause = ` AND s.District_Id = ${args['district_id']}`
    } else if (args['div_id']) {
        where_clause = ` AND d.div_id = ${args['div_id']}`
    } else if (args['block_id']) {
        where_clause = ` AND t.subdistrict_code = ${args['block_id']}`
    } else if (args['bank_code']) {
        where_clause = ` AND bb.c_bank_code = ${args['bank_code']}`
    } else {
        where_clause = ``
    }
    let q = `SELECT fs.total_paddy_area,fs.total_crop_area, fs.total_land_area, fs.total_paddy_area, mf.uf_id, fs.fs_id, fs.farmer_code, s.Society_Name, v.villcdname,IFNULL(mf.farmer_name_hi, mf.farmer_name_aadhar) AS farmer_name, mf.father_name FROM farmer_society fs
INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
INNER JOIN society s ON s.Society_Id = fs.society_id
INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
INNER JOIN mas_districts d ON d.District_ID = s.District_Id
INNER JOIN mas_cooperative_bank_district bb ON bb.district_id = s.District_Id
where fs.operation_id NOT IN (3, 5) ${where_clause} limit ?, ?`
    let q_1 = `SELECT count(1) FROM farmer_society fs
INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
INNER JOIN society s ON s.Society_Id = fs.society_id
INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
INNER JOIN mas_districts d ON d.District_ID = s.District_Id
INNER JOIN mas_cooperative_bank_district bb ON bb.district_id = s.District_Id
where fs.operation_id NOT IN (3, 5) ${where_clause}`
    let p = [from, to]
    return ({ query: q, params: [from, to] });
}

exports.farmerListforDisaplyBySocietyQueryParamObj = (society_id) => {
    return {
        query:
            `WITH cd_details AS (
SELECT cd.fs_id, mc.crop_name, cd.crop_code, cd.crop_area, cd.khasra_no, cd.village_code FROM crop_details cd
INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code WHERE cd.society_id = ${society_id}
UNION ALL
SELECT cd.fs_id,  mc.crop_name, cd.crop_code, cd.crop_area, cd.khasra_no, cd.village_code FROM crop_details_forest cd
INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code WHERE cd.society_id = ${society_id}
),
ld_details AS (
SELECT cd.fs_id, cd.land_area, cd.khasra_no, cd.village_code FROM land_details cd
WHERE cd.society_id = ${society_id}
UNION ALL
SELECT cd.fs_id, cd.land_area, cd.khasra_no, cd.village_code FROM land_details_forest cd
WHERE cd.society_id = ${society_id}
)

SELECT 
 fs.uf_id, 
    fs.farmer_code,
    ifnull(mf.farmer_name_hi, mf.farmer_name_aadhar) farmer_name, mf.father_name, v.villcdname, v.cdname, v.tehcdname, s.Society_Name, s.Society_Id,
    mf.dob, CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, -4)) aadhar_number, mf.mobile_no, CONCAT('XXXXXX', SUBSTRING(fs.account_no, -5)) account_no, fs.ifsc_code, mb.branch_name, mb.bank_name, mc.caste_name,
    fr.Name AS nominee_name, CONCAT('XXXX-XXXX-', SUBSTRING(fr.AadharNo, -4))  AS nominee_aadhar, mr.rel_name AS nominee_relation, fs.total_land_area, fs.total_paddy_area, fs.total_crop_area,
    ld.land_with_kharsa, cd.crop_with_kharsa, cdd.crop_with_area
FROM 
farmer_society fs 
INNER JOIN mas_farmer mf ON mf.uf_id = fs.uf_id
INNER JOIN mas_villages v ON v.vsr_census = fs.village_code
INNER JOIN society s ON s.Society_Id = fs.society_id
INNER JOIN mas_bankbranch mb ON mb.branch_code = fs.branch_code
INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
INNER JOIN farmerrepresentative fr ON fr.fs_id = fs.fs_id
INNER JOIN mas_relation mr ON mr.rel_id = fr.Relation
LEFT JOIN (
SELECT ld.fs_id, GROUP_CONCAT(CONCAT(ld.khasra_no, '=>', ld.land_area, '') SEPARATOR ', ') AS land_with_kharsa FROM ld_details ld GROUP BY ld.fs_id
) ld ON ld.fs_id = fs.fs_id
LEFT JOIN (
SELECT cd.fs_id, GROUP_CONCAT(CONCAT(cd.khasra_no, ":",cd.crop_name, '=>', cd.crop_area, '') SEPARATOR ', ') AS crop_with_kharsa FROM cd_details cd GROUP BY cd.fs_id 
) cd ON cd.fs_id = fs.fs_id
LEFT JOIN (
SELECT cd.fs_id, GROUP_CONCAT(CONCAT(cd.crop_name, '=>', cd.crop_area, '') SEPARATOR ', ') AS crop_with_area FROM (
SELECT cd.fs_id, cd.crop_name, SUM(cd.crop_area) crop_area FROM cd_details cd GROUP BY cd.fs_id, cd.crop_code
) cd GROUP BY cd.fs_id) cdd ON cdd.fs_id = fs.fs_id
WHERE fs.society_id = ${society_id};`
        , params: []
    }
}