exports.getcheckFarmerExistWithAadharQueryParamObj = function (aadharRef) {
    let q = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.relation, mf.father_name, mf.dob, 
    mc.caste_code as category, mc.caste_code , mf.subcaste_code AS subcaste_code,
        mf.gender, mf.mobile_no, fs.membership_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, mf.uf_id, fs.fs_id, 
       mbb.bank_code as bank_code, dd.District_ID AS bank_district, CAST(fs.branch_code AS INT) AS branch_code, CAST(mf.village_code AS INT) AS village_code, 
        mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
        mb.bank_name, mbb.branch_name, dd.District_Name AS bank_district_name, fs.society_id, s.Society_Name AS 'society_name', dd.LGD_Code, mf.aadhar_verification
       FROM mas_farmer mf
       INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
       INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
       INNER JOIN mas_tehsil mt ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
       INNER JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
       INNER JOIN mas_bank mb ON mb.bank_code = mbb.bank_code
       INNER JOIN mas_districts dd ON dd.LGD_Code = mbb.district_code
       INNER JOIN society s ON fs.society_id = s.Society_Id
       INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
        WHERE mf.aadhar_ref = '${aadharRef}' AND fs.carry_forward_status IS NULL AND ( fs.delete_status IS NULL OR fs.delete_status IN ('R'));`;
    let p = [];
    return ({ query: q, params: p });
}

exports.getCheckFarmerExistOnUFP2024 = function (aadharRef) {
    let q = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.relation, mf.father_name, mf.dob, 
    mc.caste_code as category, mc.caste_code, mf.subcaste_code AS subcaste_code,
        mf.gender, mf.mobile_no, mf.pincode, mf.address, mf.uf_id, CAST(mf.village_code AS INT) AS village_code, 
        mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mf.aadhar_verification,
        fsm.scheme_id
       FROM mas_farmer mf
       INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
       INNER JOIN mas_tehsil mt ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
       INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
       LEFT JOIN farmer_scheme_mapping fsm ON mf.uf_id = fsm.uf_id
      WHERE mf.aadhar_ref = '${aadharRef}'`;
    let p = [];
    return ({ query: q, params: p });
}

exports.getCheckFarmerAadharExistOnProcurementDB = function (aadharRef) {
    let where_clause = ``;

    let q = `SELECT CAST(mf.aadhar_number AS CHAR) aadhar_number, mf.farmer_name_aadhar, mf.farmer_name_hi, mf.relation, mf.father_name, mf.dob, 
    mc.caste_code as category, mc.caste_code , mf.subcaste_code AS subcaste_code,
        mf.gender, mf.mobile_no, fs.membership_no, mf.pincode, mf.address, fs.account_no, fs.account_no AS caccount_no, mf.uf_id, fs.fs_id, 
       mbb.bank_code as bank_code, dd.District_ID AS bank_district, CAST(fs.branch_code AS INT) AS branch_code, CAST(mf.village_code AS INT) AS village_code, 
        mt.District_ID AS district, mt.Tehsil_ID AS tehsil_id, mbb.ifsc_code,
        mb.bank_name, mbb.branch_name, dd.District_Name AS bank_district_name, fs.society_id, s.Society_Name AS 'society_name', dd.LGD_Code, mf.aadhar_verification
       FROM mas_farmer mf
       INNER JOIN farmer_society fs ON fs.uf_id = mf.uf_id
       INNER JOIN mas_villages d ON d.vsr_census = mf.village_code
       INNER JOIN mas_tehsil mt ON mt.Rev_teh_id = d.tehsilno AND mt.Rev_dist_id = d.distno
       INNER JOIN mas_bankbranch mbb ON mbb.branch_code = fs.branch_code
       INNER JOIN mas_bank mb ON mb.bank_code = mbb.bank_code
       INNER JOIN mas_districts dd ON dd.LGD_Code = mbb.district_code
       INNER JOIN society s ON fs.society_id = s.Society_Id
       INNER JOIN mas_caste mc ON mc.subcaste_code = mf.subcaste_code
        WHERE mf.aadhar_ref = '${aadharRef}' AND fs.operation_id NOT IN (3,5)`;
    let p = [];
    return ({ query: q, params: p });
}