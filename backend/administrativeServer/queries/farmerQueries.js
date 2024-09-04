
exports.getFarmerBasicDetail_Base_QueryParamObj = function (serachColumn, searchValue1, searchValue2) {
    let whereColumn = '';
    let whereColumn2 = '';
    if (+serachColumn == 0) {
        whereColumn = 'mf.uf_id';
        whereColumn2 = ` AND fs.fs_id = ${searchValue2}`;
    }
    else if (+serachColumn == 1) {
        whereColumn = 'mf.aadhar_number';
    }
    else if (+serachColumn == 2) {
        whereColumn = 'mf.uf_id';
    }
    else if (+serachColumn == 3) {
        whereColumn = 'fs.fs_id';
    }
    else if (+serachColumn == 4) {
        whereColumn = 'fs.farmer_code'
    }
    else if (+serachColumn == 5) {
        whereColumn = 'mf.uf_id';
        whereColumn2 = ` AND fs.society_id = ${searchValue2}`;
    }

    let q = `SELECT cast(mf.aadhar_number AS CHAR) aadhar_number,mf.aadhar_ref, mf.farmer_name_aadhar, 
    TRIM(mf.farmer_name_hi) as farmer_name_hi, mf.relation, mf.father_name, mf.dob, 
    mf.subcaste_code,mc.caste_code ,mf.aadhar_verification,mf.gender, mf.mobile_no, 
    fs.membership_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, 
    mf.uf_id, fs.fs_id,fs.old_fs_id, fs.pfms_flag, mbb.bank_code, CAST(mbb.district_id AS SIGNED) AS bank_district, 
    mbb.branch_code, mf.village_code, fs.society_id, 
    CAST(md.District_ID AS SIGNED) AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
    fr.Name as nominee_name, fr.TypeofPerson AS nominee_type, fr.Relation AS nominee_relation, fr.AadharNo AS nominee_aadhar,  mbb.bank_name, 
         mbb.branch_name, cast(mbb.District_Name AS CHAR) AS bank_district_name, 
         fs.village_code AS society_village_code, fs.farmer_code, 
         if(fs.pfms_flag='ACCP', 1, 0) AS is_pfms ,fs.pfms_flag, fs.pfms_name, fs.pfms_remark
         FROM mas_farmer mf
         INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
         INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
         INNER JOIN farmerrepresentative fr ON fr.fs_id = fs.fs_id
         INNER JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
         INNER JOIN mas_villages mv ON mv.vsr_census = fs.village_code
         INNER JOIN mas_districts md ON md.Rev_district_id = mv.distno
         INNER JOIN mas_tehsil mt ON mt.Rev_dist_id = mv.distno AND mt.Rev_teh_id = mv.tehsilno
    WHERE ${whereColumn} = ? ${whereColumn2} `;

    let p = [searchValue1];
    return ({ query: q, params: p });
}

exports.getFarmerLandDetails_Base_QueryParamObj = function (serachColumn, searchValue1, searchValue2) {
    let whereColumn = '';
    let whereColumn2 = '';
    if (+serachColumn == 0) {
        whereColumn = 'ld.uf_id';
        whereColumn2 = ` AND ld.fs_id = ${searchValue2}`;
    }
    else if (+serachColumn == 1) {
        whereColumn = 'mf.aadhar_number';
    }
    else if (+serachColumn == 2) {
        whereColumn = 'ld.uf_id';
    }
    else if (+serachColumn == 3) {
        whereColumn = 'ld.fs_id';
    }
    else if (+serachColumn == 4) {
        whereColumn = 'ld.farmer_code'
    }
    else if (+serachColumn == 5) {
        whereColumn = 'ld.uf_id';
        whereColumn2 = ` AND ld.society_id = ${searchValue2}`;
    }

    let q = `SELECT d.villcdname, d.VillageID, ld.uf_id, ld.fs_id ,ld.farmer_code, ld.village_code, ld.khasra_no, ld.OwnerName, mot.owner_type_name, ld.owner_type_code, ld.land_area, ld.land_type_code,mlt.land_type_name_hi , 'P' as is_verified
    FROM land_details ld 
    INNER JOIN mas_land_type mlt ON mlt.land_type_code = ld.land_type_code
    INNER JOIN mas_farmer mf ON ld.uf_id = mf.uf_id
    INNER JOIN mas_owner_type mot ON mot.owner_type_code = ld.owner_type_code
    LEFT JOIN mas_villages d ON d.vsr_census = ld.village_code
    WHERE ${whereColumn} = ? ${whereColumn2} `;

    let p = [searchValue1];
    return ({ query: q, params: p });
}

exports.getFarmerLandDetailsForest_Base_QueryParamObj = function (serachColumn, searchValue1, searchValue2) {
    let whereColumn = '';
    let whereColumn2 = '';
    if (+serachColumn == 0) {
        whereColumn = 'ld.uf_id';
        whereColumn2 = ` AND ld.fs_id = ${searchValue2}`;
    }
    else if (+serachColumn == 1) {
        whereColumn = 'mf.aadhar_number';
    }
    else if (+serachColumn == 2) {
        whereColumn = 'ld.uf_id';
    }
    else if (+serachColumn == 3) {
        whereColumn = 'ld.fs_id';
    }
    else if (+serachColumn == 4) {
        whereColumn = 'ld.farmer_code'
    }
    else if (+serachColumn == 5) {
        whereColumn = 'ld.uf_id';
        whereColumn2 = ` AND ld.society_id = ${searchValue2}`;
    }

    let q = `SELECT d.villcdname, d.VillageID, ld.uf_id, ld.fs_id ,ld.farmer_code, ld.village_code, ld.khasra_no, '' as OwnerName, '' as owner_type_name, '' as owner_type_code, ld.land_area, ld.land_type_code,mlt.land_type_name_hi , 'P' as is_verified
    FROM land_details_forest ld 
    INNER JOIN mas_land_type mlt ON mlt.land_type_code = ld.land_type_code
    INNER JOIN mas_farmer mf ON ld.uf_id = mf.uf_id
    LEFT JOIN mas_villages d ON d.vsr_census = ld.village_code
    WHERE ${whereColumn} = ? ${whereColumn2}`;

    let p = [searchValue1];
    return ({ query: q, params: p });
}
exports.checkVillageKhasra_New_QueryParamObj = function (village_code, khasra_no, fs_id, id_masterkey_khasra) {
    let where_clause = ``;
    if (fs_id && fs_id != -1) {
        where_clause += ` AND ( ld.fs_id NOT IN(${fs_id}) OR ld.fs_id IS null )`;
    }
    var q = `SELECT ld.uf_id, ld.fs_id,ld.society_id, ld.farmer_code, ld.OwnerName, mf.aadhar_number, mf.farmer_name_aadhar, 
    mf.farmer_name_hi, mf.father_name, s.Society_Name, ld.khasra_no
    FROM land_details ld 
    INNER JOIN mas_farmer mf ON mf.uf_id = ld.uf_id
    LEFT JOIN society s ON s.Society_Id = ld.society_id
    WHERE  ((ld.village_code = ${village_code} AND ld.khasra_no =  "${khasra_no}") or ld.id_masterkey_khasra = ${id_masterkey_khasra}) ${where_clause}
    LIMIT 1;`;
    var p = [];
    return ({ query: q, params: p });
};

exports.checkVillageKhasra_Base_QueryParamObj = function (village_code, khasra_no, fs_id) {
    let where_clause = ``;
    if (fs_id && fs_id != -1) {
        where_clause += ` AND ld.fs_id NOT IN(${fs_id})`;
    }
    let q = `SELECT ld.uf_id, ld.fs_id,ld.society_id, ld.farmer_code, ld.OwnerName, mf.aadhar_number, mf.farmer_name_aadhar, 
    mf.farmer_name_hi, mf.father_name, s.Society_Name, ld.khasra_no, ld.carry_forward_status
    FROM land_details ld 
    INNER JOIN mas_farmer mf ON mf.uf_id = ld.uf_id
    LEFT JOIN society s ON s.Society_Id = ld.society_id
    WHERE ld.village_code = ? AND ld.khasra_no =  ? 
    AND (ld.carry_forward_status NOT IN ('D') OR ld.carry_forward_status IS null) ${where_clause}`;
    return ({ query: q, params: [village_code, khasra_no] });
};

exports.getOldGirdawariQueryParamObj = function (village_code, khasra_no) {
    return ({
        query: `SELECT g.SubCropCode, g.CropArea, g.VillageLGCode, g.KhasraNo, g.VillageID, d.villcdname
        , mc.crop_name_hi FROM gir2023.girdawari_complete_200224 g 
INNER JOIN mas_villages d
ON d.vsr_census = g.VillageLGCode
INNER JOIN mas_crop mc
ON mc.crop_code = g.SubCropCode WHERE  g.VillageLGCode = ${village_code}  AND g.KhasraNo = "${khasra_no}"; `, params: []
    })
}

exports.checkAadharExistForSocietyInFarmerRepresentativeQPObj = function (aadharRef, society) {
    let q = `SELECT COUNT(*) as count FROM farmerrepresentative f
    WHERE f.aadhar_ref = '${aadharRef}' AND f.society = ?`;
    let p = [+society];
    return ({ query: q, params: p });
}

exports.getForestCrop_Base_QueryParamObj = function (village, khasra_no, fs_id) {
    let q = `SELECT cd.land_type_code,
CASE WHEN cd.land_type_code = 1 THEN 'RG' 
when cd.land_type_code = 2 THEN 'VP'
when cd.land_type_code = 3 THEN 'VG'
when cd.land_type_code = 4 THEN 'US' END AS type,mlt.land_type_name_hi AS 'village_type', mv.villcdname AS 'village_name', mc.crop_name_hi as crop_name,
CASE WHEN cd.crop_status_code = 1 THEN 'OC' 
when cd.crop_status_code = 2 THEN 'CC'
when cd.crop_status_code = 3 THEN 'PC'
when cd.crop_status_code = 4 THEN 'NE' END as 'status', cd.village_code,cd.crop_code, cd.khasra_no, cd.crop_area  FROM crop_details_forest cd
    LEFT JOIN mas_villages mv ON cd.village_code = mv.vsr_census
    INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code
    INNER JOIN mas_crop_status mcs ON mcs.crop_status_code = cd.crop_status_code
    INNER JOIN mas_land_type mlt ON mlt.land_type_code = cd.land_type_code
     WHERE cd.fs_id = ? AND cd.village_code = ? AND cd.khasra_no = "${khasra_no}";`;
    let p = [fs_id, village];
    return { query: q, params: p };
}
exports.getForestCrop_New_QueryParamObj = function (village, khasra_no, fs_id) {
    let q = `SELECT cd.land_type_code,
CASE WHEN cd.land_type_code = 1 THEN 'RG' 
when cd.land_type_code = 2 THEN 'VP'
when cd.land_type_code = 3 THEN 'VG'
when cd.land_type_code = 4 THEN 'US' END AS type,mlt.land_type_name_hi AS 'village_type', mv.villcdname AS 'village_name', mc.crop_name_hi as crop_name,
CASE WHEN cd.crop_status_code = 1 THEN 'OC' 
when cd.crop_status_code = 2 THEN 'CC'
when cd.crop_status_code = 3 THEN 'PC'
when cd.crop_status_code = 4 THEN 'NE' END as 'status', cd.village_code,cd.crop_code, cd.khasra_no, cd.crop_area  FROM crop_details_forest cd
    LEFT JOIN mas_villages mv ON cd.village_code = mv.vsr_census
    INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code
    INNER JOIN mas_crop_status mcs ON mcs.crop_status_code = cd.crop_status_code
    INNER JOIN mas_land_type mlt ON mlt.land_type_code = cd.land_type_code
     WHERE cd.fs_id = ? AND cd.village_code = ? AND cd.khasra_no = "${khasra_no}";`
    let p = [fs_id, village];
    return { query: q, params: p };
}

exports.getFarmerBasicDetailForReciptQueryParamObj = function (fs_id) {
    return ({
        query: `SELECT CONCAT('XXXXXXXX', SUBSTRING(mf.aadhar_number, 9)) aadhar_number, mf.farmer_name_aadhar, mf.farmer_name_hi, case when mf.relation = 'F' then 'पिता' when mf.relation = 'M' then 'माता' when mf.relation = 'H' then 'पति' END relation, mf.father_name, mf.dob, 
    mc.caste_code as category, mf.subcaste_code AS subcaste_code,
        mf.gender, CAST(mf.mobile_no AS CHAR) mobile_no, fs.membership_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, mf.uf_id, fs.fs_id, 
       mbb.bank_code as bank_code, dd.District_ID AS bank_district, CAST(fs.branch_code AS INT) AS branch_code, CAST(mf.village_code AS INT) AS village_code, 
        mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
        mb.bank_name, mbb.branch_name, dd.District_Name AS bank_district_name, fs.society_id, s.Society_Name AS 'society_name', dd.LGD_Code,
        fr.TypeofPerson AS nominee_type, 
        case when fr.TypeofPerson = 1 then 'रिस्तेदार' when fr.TypeofPerson = 2 then 'विश्वसनीय व्यक्ति' when fr.TypeofPerson = 0 then 'स्वयं' end nominee_type_name,
        fr.Name AS nominee_name, mr.rel_name AS nominee_relation, CONCAT('XXXXXXXX', SUBSTRING(fr.AadharNo, 9)) AS nominee_aadhar, fs.farmer_code,
        FORMAT(CAST(fs.total_crop_area AS FLOAT), 4) total_crop_area, FORMAT(CAST(fs.total_land_area AS FLOAT), 4) total_land_area, FORMAT(CAST(fs.total_paddy_area AS FLOAT), 4) total_paddy_area,
        fs.entry_type_code,IFNULL(fs.updated_dtstamp, fs.dtstamp) AS dtstamp, fs.is_update, d.villcdname, d.tehcdname, d.cdname, d.halka,  mc.caste_name
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
        WHERE fs.fs_id = ?;`, params: [fs_id]
    })
}

exports.getFarmerRegistrationLandAndCropQuery = (fs_id) => {
    return ({
        query: `SELECT l.land_type_code, l.land_type_name_hi, SUM(ld.land_area) land_area, 
        SUM(ld.crop_area) crop_area, SUM(ld.paddy_area) paddy_area FROM mas_land_type l
        INNER JOIN 
        (
        SELECT ld.land_type_code, SUM(ld.land_area) land_area, SUM(cd.crop_area) crop_area, 
         sum(case when cd.crop_code = 104 then cd.crop_area ELSE 0 END) AS paddy_area
         FROM land_details ld
        LEFT JOIN crop_details cd ON cd.id_masterkey_khasra = ld.id_masterkey_khasra 
        WHERE ld.fs_id = ?
        GROUP BY ld.land_type_code
        UNION ALL
        SELECT ld.land_type_code, SUM(ld.land_area) land_area, SUM(cd.crop_area) crop_area,
         sum(case when cd.crop_code = 104 then cd.crop_area ELSE 0 END) AS paddy_area
         FROM land_details_forest ld
        LEFT JOIN crop_details_forest cd ON cd.land_forest_id = ld.land_forest_id 
        WHERE ld.fs_id = ?
        GROUP BY ld.land_type_code) ld ON l.land_type_code = ld.land_type_code
        GROUP BY l.land_type_code`, params: [+fs_id, +fs_id]
    })
}

exports.getFarmerLandDetailsForRecieptQueryParamObj = function (fs_id) {
    return ({
        query: `SELECT d.villcdname, ld.village_id, d.halka, ld.uf_id, ld.farmer_code, ld.village_code, ld.khasra_no, 
    ld.OwnerName, ld.owner_type_code, mot.owner_type_name, ld.land_area, FORMAT(CAST(ld.land_area AS FLOAT), 4) land_area_d, ld.land_type_code, mlt.land_type_name_hi , 1 as 'land_table'
        FROM land_details ld 
        INNER JOIN mas_farmer mf ON ld.uf_id = mf.uf_id
        inner JOIN mas_villages d ON d.vsr_census = ld.village_code
        INNER JOIN mas_land_type mlt ON mlt.land_type_code = ld.land_type_code
        INNER JOIN mas_owner_type mot ON mot.owner_type_code = ld.owner_type_code
        WHERE ld.fs_id = ?
    UNION
    SELECT d.villcdname, null as village_id, d.halka, ldf.uf_id, ldf.farmer_code, ldf.village_code, ldf.khasra_no, 
     null as OwnerName, null as owner_type_code, null as owner_type_name, ldf.land_area, FORMAT(CAST(ldf.land_area AS FLOAT), 4) land_area_d, ldf.land_type_code, mlt.land_type_name_hi, 2 as 'land_table'
        FROM land_details_forest ldf 
        INNER JOIN mas_farmer mf ON ldf.uf_id = mf.uf_id
        inner JOIN mas_villages d ON d.vsr_census = ldf.village_code
        INNER JOIN mas_land_type mlt ON mlt.land_type_code = ldf.land_type_code
        WHERE ldf.fs_id = ?`, params: [fs_id, fs_id]
    })
}
exports.getFarmerCropByVillageCodeAndKhasraForReciept = function (fs_id, village_code, khasra_no, land_table) {
    let table_name = ``;
    if (land_table == 1) {
        table_name = `crop_details`
    } else {
        table_name = `crop_details_forest`
    }
    let q = `SELECT cd.crop_area, mc.crop_name_hi, FORMAT(CAST(cd.crop_area AS FLOAT), 4) crop_area_d, cd.crop_status_code, mcs.crop_status_name
    FROM ${table_name} cd 
    INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code
    INNER JOIN mas_crop_status mcs ON mcs.crop_status_code = cd.crop_status_code
    WHERE cd.fs_id = ? AND cd.village_code = ? AND cd.khasra_no = ?`,
        p = [fs_id, village_code, khasra_no];
    return { "query": q, "params": p }
}

exports.getFarmerBasicDetailsForVarisanQueryParam = function (fs_id) {
    let q = `SELECT cast(mf.aadhar_number AS CHAR) aadhar_number, mf.farmer_name_aadhar, TRIM(mf.farmer_name_hi) as farmer_name_hi, 
    mf.relation, mf.father_name, mf.dob, c.caste_name, c.subcaste_name, fs.farmer_code, mf.gender, mf.mobile_no, 
    fs.account_no, mf.uf_id, fs.fs_id, CAST(dd.District_ID AS SIGNED)  AS bank_district, fs.branch_code, 
	 mf.village_code, fs.society_id, 
         CAST(t.District_ID AS SIGNED) AS district, t.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
        mb.bank_name, mbb.branch_name, cast(dd.District_Name AS CHAR) AS bank_district_name, fs.village_code AS society_village_code,
         dd.LGD_Code, s.Society_Name, d.villcdname, d.halka, d.cdname, d.tehcdname, fs.old_fs_id, mb.bank_code, mf.pincode, mf.address,
        CONCAT('XXXX-XXXX-', SUBSTRING(mf.aadhar_number, 9,LENGTH(mf.aadhar_number))) AS aadhar_no
        FROM mas_farmer mf 
        INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
        INNER JOIN mas_caste c ON mf.subcaste_code = c.subcaste_code
        INNER JOIN society s ON s.Society_Id = fs.society_id
        INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
        INNER JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
        INNER JOIN mas_bank mb ON mb.bank_code = mbb.bank_code
        INNER JOIN mas_districts dd ON dd.LGD_Code = mbb.district_code
        INNER JOIN mas_tehsil t ON t.Rev_dist_id = d.distno AND t.Rev_teh_id = d.tehsilno
        WHERE fs.fs_id = ?`,
        p = [fs_id];
    return { "query": q, "params": p };
}

exports.getFarmerAllLandDetails = function (fs_id) {
    let q = `SELECT d.villcdname,
       d.VillageID,
       ld.uf_id,
       ld.fs_id,
       ld.farmer_code,
       ld.village_code,
       ld.khasra_no,
       ld.OwnerName,
       mot.owner_type_name,
       ld.land_area,
       mlt.land_type_name_hi AS land_type,
       ld.land_type_code,
       1 AS 'land_table',
       CASE
           WHEN ld.land_type_code = 1 THEN 'RG'
           WHEN ld.land_type_code = 2 THEN 'VP'
           WHEN ld.land_type_code = 3 THEN 'VG'
           WHEN ld.land_type_code = 4 THEN 'US'
       END AS 'type'
FROM land_details ld
INNER JOIN mas_farmer mf ON ld.uf_id = mf.uf_id
INNER JOIN mas_owner_type mot ON mot.owner_type_code = ld.owner_type_code
LEFT JOIN mas_villages d ON d.vsr_census = ld.village_code
INNER JOIN mas_land_type mlt ON mlt.land_type_code = ld.land_type_code
WHERE ld.fs_id = ?
UNION
SELECT d.villcdname,
       d.VillageID,
       ld.uf_id,
       ld.fs_id,
       ld.farmer_code,
       ld.village_code,
       ld.khasra_no,
       '' AS OwnerName,
       '' AS owner_type_name,
       ld.land_area,
       mlt.land_type_name_hi AS land_type,
       ld.land_type_code,
       2 AS 'land_table',
       CASE
           WHEN ld.land_type_code = 1 THEN 'RG'
           WHEN ld.land_type_code = 2 THEN 'VP'
           WHEN ld.land_type_code = 3 THEN 'VG'
           WHEN ld.land_type_code = 4 THEN 'US'
       END AS 'type'
FROM land_details_forest ld
INNER JOIN mas_farmer mf ON ld.uf_id = mf.uf_id
LEFT JOIN mas_villages d ON d.vsr_census = ld.village_code
INNER JOIN mas_land_type mlt ON mlt.land_type_code = ld.land_type_code
WHERE ld.fs_id = ?`,
        p = [fs_id, fs_id];
    return { "query": q, "params": p };
}

exports.getFarmerCropByVillageCodeAndKhasraForVarisan = function (fs_id, village_code, khasra_no, land_type) {
    let table_name = ``;
    if (land_type == 1) {
        table_name = `crop_details`
    } else {
        table_name = `crop_details_forest`
    }
    let q = `SELECT cd.crop_area, cd.crop_code, mcs.crop_status_name AS crop_status, mc.crop_name_hi
    FROM ${table_name} cd
   INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code
   INNER JOIN mas_crop_status mcs ON mcs.crop_status_code = cd.crop_status_code
   WHERE cd.fs_id = ? AND cd.village_code = ? AND cd.khasra_no = ?`,
        p = [fs_id, village_code, khasra_no];
    return { "query": q, "params": p }

}

exports.getFarmerBasicDetailQueryParamObj = function (serachColumn, searchValue1, searchValue2) {
    let whereColumn = '';
    if (+serachColumn == 1) {
        whereColumn = `mf.aadhar_number = ${searchValue1}`;
    }
    else if (+serachColumn == 2) {
        whereColumn = `mf.uf_id = ${searchValue1}`;
    }
    else if (+serachColumn == 3) {
        whereColumn = `fs.fs_id = ${searchValue1}`;
    }
    else if (+serachColumn == 4) {
        whereColumn = `fs.farmer_code = '${searchValue1}'`
    } else if (+serachColumn == 5) {
        whereColumn = `mf.uf_id = ${searchValue1} and fs.society_id = '${searchValue2}'`
    }

    let q = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number,CONCAT('XXXXXXXX', SUBSTRING(mf.aadhar_number, 9)) mas_aadhar_number,
       mf.aadhar_ref,
       mf.farmer_name_aadhar,
       mf.farmer_name_hi,
       mf.relation,
       CASE
           WHEN mf.relation = 'F' THEN 'पिता'
           WHEN mf.relation = 'M' THEN 'माता'
           WHEN mf.relation = 'H' THEN 'पति'
       END relation_name,
       mf.father_name,
       mf.dob,
       fs.old_fs_id,
       fs.farmer_code,
       mc.caste_code,
       mf.subcaste_code,
       mf.gender,
       mf.mobile_no,
       fs.membership_no,
       mf.pincode,
       mf.address,
       fs.account_no,
       fs.account_no AS caccount_no,
       fs.total_crop_area,
       fs.total_land_area,
       fs.total_paddy_area,
       fs.entry_type_code,
       mf.uf_id,
       fs.fs_id,
       mbb.bank_code AS bank_code,
       dd.District_ID AS bank_district,
       CAST(fs.branch_code AS INT) AS branch_code,
       CAST(mf.village_code AS INT) AS village_code,
       mt.District_ID AS district,
       mt.Tehsil_ID AS tehsil_id,
       mbb.ifsc_code,
       fs.pfms_flag,
       fs.pfms_name,
       fs.pfms_remark,
       if(fs.pfms_flag='ACCP', 1, 0) AS is_pfms,
       mb.bank_name,
       mbb.branch_name,
       dd.District_Name AS bank_district_name,
       fs.society_id ,
       s.Society_Name AS 'society_name',
       dd.LGD_Code,
       d.villcdname,
       d.halka,
       d.tehcdname,
       d.cdname,
       fr.TypeofPerson AS nominee_type,
       fr.Name AS nominee_name,
       mr.rel_id AS nominee_relation,
       mr.rel_name AS nominee_relation_name,
       cast(fr.AadharNo AS CHAR) AS nominee_aadhar,
       CONCAT('XXXXXXXX', SUBSTRING(fr.AadharNo, 9)) AS mas_nominee_aadhar,
       fr.aadhar_ref AS nominee_aadhar_ref,
       CASE
           WHEN fr.TypeofPerson = 1 THEN 'रिस्तेदार'
           WHEN fr.TypeofPerson = 2 THEN 'विश्वसनीय व्यक्ति'
           WHEN fr.TypeofPerson = 0 THEN 'स्वयं'
       END nominee_type_name,
       fs.village_code AS 'society_village_code'
FROM mas_farmer mf
INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
INNER JOIN mas_tehsil mt ON mt.Rev_teh_id = d.tehsilno
AND mt.Rev_dist_id = d.distno
INNER JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
INNER JOIN mas_bank mb ON mb.bank_code = mbb.bank_code
INNER JOIN mas_districts dd ON dd.LGD_Code = mbb.district_code
INNER JOIN society s ON fs.society_id = s.Society_Id
INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
INNER JOIN farmerrepresentative fr ON fr.fs_id = fs.fs_id
INNER JOIN mas_relation mr ON fr.Relation = mr.rel_id
WHERE ${whereColumn};`
    let q_ = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number, mf.aadhar_ref,mf.farmer_name_aadhar, mf.farmer_name_hi, mf.relation, mf.father_name, mf.dob, fs.old_fs_id, fs.farmer_code,
    mc.caste_code , mf.subcaste_code ,
        mf.gender, mf.mobile_no, fs.membership_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, mf.uf_id, fs.fs_id,
       mbb.bank_code as bank_code, dd.District_ID AS bank_district, CAST(fs.branch_code AS INT) AS branch_code, CAST(mf.village_code AS INT) AS village_code, 
        mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,fs.pfms_flag, fs.pfms_name, fs.pfms_remark, if(fs.pfms_flag='ACCP', 1, 0) AS is_pfms,
        mb.bank_name, mbb.branch_name, dd.District_Name AS bank_district_name, fs.society_id AS 'society', s.Society_Name AS 'society_name', dd.LGD_Code, d.villcdname , d.halka,d.tehcdname,d.cdname,
        fr.TypeofPerson AS nominee_type, fr.Name AS nominee_name, mr.rel_id AS nominee_relation, cast(fr.AadharNo AS CHAR) AS nominee_aadhar,fs.village_code AS 'society_village_code'
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
        WHERE ${whereColumn}`;
    return ({ query: q, params: [] });
}

exports.getFarmerForestLandQueryParamObj = function (serachColumn, searchValue1) {
    let whereColumn = '';
    if (+serachColumn == 2) {
        whereColumn = `ldf.uf_id = ${searchValue1}`;
    }
    else if (+serachColumn == 3) {
        whereColumn = `ldf.fs_id = ${searchValue1}`;
    }
    else if (+serachColumn == 4) {
        whereColumn = `ldf.farmer_code = '${searchValue1}'`
    }

    let q = `SELECT d.villcdname AS 'village_name', ldf.uf_id, ldf.farmer_code, ldf.village_code, ldf.khasra_no, ldf.land_area AS 'area', 
CASE WHEN ldf.land_type_code = 1 THEN 'RG' 
when ldf.land_type_code = 2 THEN 'VP'
when ldf.land_type_code = 3 THEN 'VG'
when ldf.land_type_code = 4 THEN 'US' END AS type,
CASE WHEN ldf.land_type_code = 1 THEN 'राजस्व ग्राम' 
when ldf.land_type_code = 2 THEN 'वनाधिकार पट्टा (राजस्व ग्राम)'
when ldf.land_type_code = 3 THEN 'वन ग्राम'
when ldf.land_type_code = 4 THEN 'असर्वेक्षित ग्राम' END AS village_type,
ldf.land_type_code,ldf.flag_varis_land
FROM land_details_forest ldf
INNER JOIN mas_farmer mf ON ldf.uf_id = mf.uf_id
INNER JOIN mas_villages d ON d.vsr_census = ldf.village_code
INNER JOIN mas_land_type mlt ON mlt.land_type_code = ldf.land_type_code
WHERE ${whereColumn};`
    return ({ query: q, params: [] });
}
exports.getFarmerRgLandQueryParamObj = function (serachColumn, searchValue1, searchValue2) {
    let whereColumn = '';
    if (+serachColumn == 2) {
        whereColumn = `ld.uf_id = ${searchValue1}`;
    }
    else if (+serachColumn == 3) {
        whereColumn = `ld.fs_id = ${searchValue1}`;
    }
    else if (+serachColumn == 4) {
        whereColumn = `ld.farmer_code = '${searchValue1}'`
    } else if (+serachColumn == 5) {
        whereColumn = `ld.uf_id = ${searchValue1} and ld.society_id = '${searchValue2}'`
    }

    let q = `SELECT d.villcdname, ld.village_id, d.halka, ld.uf_id, ld.farmer_code, ld.village_code, ld.khasra_no, 
    ld.OwnerName, ld.owner_type_code, mot.owner_type_name, ld.land_area, FORMAT(CAST(ld.land_area AS FLOAT), 4) land_area_d, ld.land_type_code, mlt.land_type_name_hi , 1 as 'land_table'
        FROM land_details ld 
        INNER JOIN mas_farmer mf ON ld.uf_id = mf.uf_id
        inner JOIN mas_villages d ON d.vsr_census = ld.village_code
        INNER JOIN mas_land_type mlt ON mlt.land_type_code = ld.land_type_code
        INNER JOIN mas_owner_type mot ON mot.owner_type_code = ld.owner_type_code
        WHERE ${whereColumn};`
    return ({ query: q, params: [] });
}

exports.getFarmerForestCropQueryParamObj = function (serachColumn, searchValue1, searchValue2) {
    let whereColumn = '';
    if (+serachColumn == 2) {
        whereColumn = `cdf.uf_id = ${searchValue1}`;
    }
    else if (+serachColumn == 3) {
        whereColumn = `cdf.fs_id = ${searchValue1}`;
    }
    else if (+serachColumn == 4) {
        whereColumn = `cdf.farmer_code = '${searchValue1}'`
    }
    else if (+serachColumn == 5) {
        whereColumn = `cdf.uf_id = ${searchValue1} and cdf.society_id = '${searchValue2}'`
    }
    let q = `SELECT cdf.* FROM crop_details_forest cdf
    WHERE ${whereColumn} `;
    return ({ query: q, params: [] });
}

exports.getFarmerRgCropDetailsByVillageKhasraQueryParamObj = function (village_code, khasra_no) {
    return ({
        query: `SELECT cd.crop_code, cd.crop_area,cd.village_code,cd.khasra_no, mv.villcdname, mv.VillageID, mc.crop_name_hi, cd.girdawari_status,mcs.crop_status_short_name AS 'status' FROM crop_details cd
    INNER JOIN mas_villages mv ON mv.vsr_census = cd.village_code
    INNER JOIN mas_crop mc ON mc.crop_code = cd.crop_code
    INNER JOIN mas_crop_status mcs ON mcs.crop_status_code = cd.crop_status_code
    WHERE cd.village_code = ? and cd.khasra_no = ?; `,
        params: [village_code, khasra_no]
    })
}