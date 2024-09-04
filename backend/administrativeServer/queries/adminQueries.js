
exports.getUserTypeForPassResetOnAdmin = function(){
    return ({
        query: `SELECT mt.usertype, mt.type_name_hi FROM mas_user_type mt
        WHERE mt.usertype NOT IN (2)`, params: []
    });
}


/* ============================================
Menu
==============================================*/
exports.getMenuList = (usertype) => {
    let whereObj = ''
    if(usertype && usertype!='-1'){
        whereObj += `WHERE mm.usertype = ${usertype}`
    }
    let q = `SELECT mm.*, m.type_name_hi FROM mas_menu mm INNER JOIN mas_user_type m ON mm.usertype = m.usertype ${whereObj} 
    ORDER BY mm.menuOrder, mm.menuCode, mm.usertype`
    return {'query': q, 'params': ''}
}

exports.deleteMenuUsingMenuCode = (menu_code) => {
    let q = `DELETE from mas_menu WHERE mas_menu.menuCode = ${menu_code}`
    return {'query': q, 'params': ''}
}

exports.disableActiveMenu = (menu_code, status) => {
    let q = `UPDATE mas_menu m SET m.is_active = ${status} WHERE m.menuCode  = ${menu_code}`
    return {'query': q, 'params': ''}
}

exports.addNewMenu = (params) => {
    let q = 'INSERT INTO mas_menu (`name`, `route`, `icon`, `type`, `usertype`, `menuOrder`, `is_new` , `is_active`, `children`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)'
    let p = [params.name, params.route, params.icon, params.type, params.usertype, params.menuOrder, params.is_new, false]
    return {'query': q, 'params': p}
}


/* ============================================
Slow Query
==============================================*/

exports.slowQueryList = (offset, size) => {
    let arr = []
    let q = `SELECT * FROM slow_queries s where s.status=0 ORDER BY s.dtstamp desc limit ?,?`
    let p = [offset, size]
    let q_1 = `SELECT COUNT(1) AS total FROM slow_queries s`
    let p_2 = []
    arr.push({'query': q, 'params': p})
    arr.push({'query': q_1, 'params': p_2})
    return arr
}

exports.slowQueryStatus = (sid, status) => {
    let q = `update slow_queries s SET s.status = ? WHERE s.sid=?`
    let p = [ +status, +sid]
    return {'query': q, 'params': p}
}

exports.errorLog = (offset, size, user_id) => {
    let whereObj = ``, arr = []
    if(user_id != ''){
        whereObj += ` WHERE e.user_id = ${user_id} `
    }
    let q = `SELECT e.id, e.err, e.api_name, e.time, e.user_id 
    FROM error_table e ${whereObj}
    order BY id desc LIMIT ?,?`
    let p = [ offset, size]
    arr.push({'query': q, 'params': p})
    let q_1 = `SELECT COUNT(1) as total FROM error_table e ${whereObj}`
    arr.push({'query': q_1, 'params': []})
    return arr
}

exports.RefreshReportTable  = () => {
    let q = `UPDATE report_table t
    INNER JOIN (SELECT fs.village_code, fs.society_id, 
        COUNT(DISTINCT CASE WHEN fs.entry_type_code = 1 AND vf.fs_id IS null THEN fs.fs_id END) AS cf, 
        COUNT(DISTINCT CASE WHEN vf.fs_id IS not null THEN vf.fs_id END) AS vp_count, 
        COUNT(DISTINCT CASE WHEN fs.entry_type_code = 2 AND vf.fs_id IS null AND fs.updated_ip_address IS null THEN fs.fs_id END) AS nf, 
        COUNT(DISTINCT CASE WHEN fs.is_update = 'Y' AND vf.fs_id IS NULL AND fs.updated_ip_address IS null THEN fs.fs_id END) AS sf, 
        COUNT(DISTINCT CASE WHEN fs.is_update = 'Y' AND fs.updated_ip_address IS not null THEN fs.fs_id END) AS tsf, 
        COUNT(DISTINCT CASE WHEN fs.entry_type_code = 2 AND vf.fs_id IS null AND r.is_approved = 1 AND fs.updated_ip_address IS null THEN fs.fs_id END) AS rnf, 
        COUNT(DISTINCT CASE WHEN fs.is_update = 'Y' AND vf.fs_id IS null  AND r.is_approved = 1 AND fs.updated_ip_address IS null THEN fs.fs_id END) AS rsf,
        COUNT(DISTINCT CASE WHEN r.is_approved = 0 THEN fs.fs_id END) AS rrf,
        COUNT(DISTINCT CASE WHEN cd.land_type_code = 1 THEN fs.fs_id END) AS rg_farmer,
        COUNT(DISTINCT CASE WHEN cd.land_type_code = 2 THEN fs.fs_id END) AS vp_farmer,
        COUNT(DISTINCT CASE WHEN cdf.land_type_code = 2 THEN fs.fs_id END) AS vp_farmer_f,
        COUNT(DISTINCT CASE WHEN cdf.land_type_code = 3 THEN fs.fs_id END) AS vg_farmer,
        COUNT(DISTINCT CASE WHEN cdf.land_type_code = 4 THEN fs.fs_id END) AS us_farmer,
        SUM(CASE WHEN cd.land_type_code = 1 THEN cd.crop_area ELSE 0 END) AS rg_area, 
        SUM(CASE WHEN cd.land_type_code = 2 THEN cd.crop_area ELSE 0 END) AS vp_area, 
        SUM(CASE WHEN cdf.land_type_code = 2 THEN cdf.crop_area ELSE 0 END) AS vp_area_f, 
        SUM(CASE WHEN cdf.land_type_code = 3 THEN cdf.crop_area ELSE 0 END) AS vg_area, 
        SUM(CASE WHEN cdf.land_type_code = 4 THEN cdf.crop_area ELSE 0 END) AS us_area
        FROM farmer_society fs
       LEFT JOIN crop_details cd ON cd.fs_id = fs.fs_id
       LEFT JOIN crop_details_forest cdf ON cdf.fs_id = fs.fs_id
       LEFT JOIN raeo_approved r ON r.fs_id = fs.fs_id
       LEFT JOIN varisan_farmer vf ON vf.varis_fs_id = fs.fs_id
       GROUP BY fs.village_code, fs.society_id) fs ON t.village_code = fs.village_code AND t.society_id = fs.society_id
  SET t.cf = fs.cf, t.vp_count = fs.vp_count, t.nf = fs.nf, t.sf = fs.sf, t.tsf = fs.tsf , t.rnf = fs.rnf, t.rsf = fs.rsf, t.rrf = fs.rrf, t.rg_farmer = fs.rg_farmer,
  t.vp_farmer = fs.vp_farmer, t.vp_farmer_f = fs.vp_farmer_f,t.vg_farmer = fs.vg_farmer,
  t.us_farmer = fs.us_farmer, t.rg_area = fs.rg_area, t.vp_area = fs.vp_area, t.vp_area_f = fs.vp_area_f, t.vg_area = fs.vg_area,
  t.us_area = fs.us_area`
    return {query: q, params: []}
}

exports.RefereshRGKNYTable = () => {
    let q = `UPDATE farmer_society_carry_delete_count f
    INNER JOIN (SELECT fs.society, fs.village_code, d.District_ID distno, t.DistrictTehsilID, t.Tehsil_ID tehsilno, d.div_id,
        m.subdistrictcode_census,
        COUNT(DISTINCT fs.fs_id) AS total,
        SUM(CASE WHEN fs.carry_forward_status = 'C' THEN 1 ELSE 0 END) AS carry, 
        SUM(CASE WHEN fs.carry_forward_status = 'D' THEN 1 ELSE 0 END) AS deleted,
        SUM(CASE WHEN fs.carry_forward_status = 'R' THEN 1 ELSE 0 END) AS requested
        FROM farmer_society fs 
        INNER JOIN society s ON s.Society_Id = fs.society
        INNER JOIN mas_tehsil t ON t.District_ID = s.District_Id AND t.Tehsil_ID = s.Block_Id
        INNER JOIN mas_districts d ON d.District_ID = t.District_ID
        INNER JOIN mas_villages m ON m.vsr_census = fs.village_code
        GROUP BY fs.society, fs.village_code) fs ON fs.society = f.society AND f.village_code = fs.village_code
    SET f.carry = fs.carry, f.deleted = fs.deleted, f.requested = fs.requested, f.distno = fs.distno, f.DistrictTehsilID = fs.DistrictTehsilID,
    f.tehsilno = fs.tehsilno, f.div_id = fs.div_id, f.subdistrictcode_census = fs.subdistrictcode_census`
    return {query: q, params: []}
}

exports.showSessionList = (params) => {
    let usertype = +params['usertype'], whereObj = ``
    let size = +params["size"];
    let page = +params["page"];
    let user_id = params["user_id"];
    let season = params['season']
    let offset = page * size;
    if(usertype!='-1' || user_id != '' || season){
        whereObj += `where `
    }
    if (usertype!='-1'){
        whereObj += ` u.usertype = ${usertype}`
    }
    if (user_id != ''){
        whereObj += ` u.user_id = ${+user_id}`
    }
    if (season){
        whereObj += ` s.season = ${+season}`
    }
    let q = `SELECT s.user_id, u.username, COUNT(s.user_id) AS times, d.District_Name, s.season,t.Tehsil_Name, uu.type_name_hi, s.session_id, 
    JSON_UNQUOTE(JSON_EXTRACT(s.data, '$.cookie.expires')) AS expires  
    FROM sessions s 
    INNER JOIN users u ON u.user_id = s.user_id
    INNER JOIN mas_user_type uu ON uu.usertype = u.usertype
    LEFT JOIN mas_districts d ON d.District_ID = u.district_id
    LEFT JOIN mas_tehsil t ON t.District_ID = u.district_id AND t.Tehsil_ID = u.tehsil_id
    ${whereObj}
    GROUP BY s.user_id LIMIT ?, ?;
    SELECT COUNT(DISTINCT s.user_id) total FROM sessions s 
    INNER JOIN users u ON u.user_id = s.user_id ${whereObj}`
    let p = [offset, size]
    return {query: q, params: p}
}

exports.terminateUserSession = (params) => {
    let whereObj = ''
    let user_id = params['user_id']
    let usertype = params['usertype']
    if(usertype!='-1' || user_id != ''){
        whereObj += `where 1  `
    }
    if (usertype!='-1'){
        whereObj += ` and u.usertype = ${+usertype}`
    }
    if (user_id != '-1'){
        whereObj += ` and u.user_id = ${+user_id}`
    }
    console.log(whereObj);
    let q = `DELETE FROM sessions 
    WHERE sessions.user_id IN (
    SELECT u.user_id from users u
    ${whereObj})`
    let p = ``
    return {query: q, params: p}
}


/* ============================================
Ganna Report
==============================================*/

exports.GannaPanjiyanDistrictWise = () => {
    let q = `SELECT
    dtdist.District_Name,ifnull(dtdatatot.distfarmer,0) ddistfarmer ,
    ifnull(dtdatatot.distpanjfarmer,0) ddistpanjfarmer
    ,ifnull(ROUND(dtdatatot.panjiarea,2),0) dpanjiarea
    ,ifnull(dtdatatotpanji.distfarmer,0) distfarmer,
    ifnull(dtdatatotpanji.distpanjfarmer,0) distpanjfarmer,
    ifnull(ROUND(dtdatatotpanji.panjiarea,2),0) panjiarea
    FROM (
    
    (SELECT md.District_ID,md.District_Name FROM mas_districts md ) dtdist
    left JOIN 
    (SELECT s.District_Id,COUNT(DISTINCT fs.uf_id) distfarmer,COUNT(DISTINCT fs.fs_id) distpanjfarmer
    ,SUM(cd.crop_area) panjiarea FROM farmer_society fs 
        INNER JOIN land_details ld ON ld.fs_id=fs.fs_id 
        INNER JOIN crop_details cd ON cd.fs_id=ld.fs_id AND cd.id_masterkey_khasra=ld.id_masterkey_khasra
        INNER JOIN society s ON s.society_id=fs.society_id
        WHERE cd.crop_code=307 GROUP BY s.District_Id) dtdatatot
      on dtdist.District_ID=dtdatatot.District_Id
      
      left JOIN 
    (SELECT s.District_Id,COUNT(DISTINCT fs.uf_id) distfarmer,COUNT(DISTINCT fs.fs_id) distpanjfarmer
    ,SUM(gp.buyinglimit) panjiarea FROM farmer_society fs     
        INNER JOIN society s ON s.society_id=fs.society_id
        INNER JOIN ganna_panjiyan gp ON fs.fs_id=gp.fs_id
        GROUP BY s.District_Id) dtdatatotpanji
      on dtdist.District_ID=dtdatatotpanji.District_Id
      
    ) ORDER BY dtdist.District_Name`
    let p = []
    return {query: q, params: p}
}

exports.GannaPanjiyanSocietywise = () => {
    let q = `SELECT t1.societyid,t1.Society_Name,t1.sname,t2.distpanjfarmertot,t2.carrytot,t2.newptot,t2.panjiareatot
    ,t1.distpanjfarmer,t1.carry,t1.newp,t1.panjiarea
    FROM (
    SELECT dtmas.societyid,dtmas.Society_Name,dtmas.sname
    , IFNULL(COUNT(dtdata.fs_id),0) distpanjfarmer
    , IFNULL(SUM(CASE WHEN dtdata.entry_type_code=1 THEN 1 ELSE 0 END),0) carry
    , IFNULL(SUM(CASE WHEN dtdata.entry_type_code=2 THEN 1 ELSE 0 END),0) newp
    , IFNULL(ROUND(SUM(dtdata.buyinglimit),2),0) panjiarea
    FROM (
     (
    SELECT gm.societyid,s.Society_Name, GROUP_CONCAT(DISTINCT gm.user_id,'-',gm.AEO_Name) sname
    FROM ganna_mapping gm
    INNER JOIN society s ON gm.societyid=s.Society_Id
    GROUP BY gm.societyid,s.Society_Name) dtmas
    LEFT JOIN 
     (
    SELECT fs.society_id,gp.fs_id,gp.buyinglimit,fs.entry_type_code
    FROM ganna_panjiyan gp
    INNER JOIN farmer_society fs ON gp.fs_id=fs.fs_id) dtdata ON dtmas.societyid=dtdata.society_id
    )
    GROUP BY dtmas.societyid,dtmas.Society_Name,dtmas.sname) t1
    INNER JOIN 
     (
    SELECT dttot.societyid
    , IFNULL(COUNT(dttot.fs_id),0) distpanjfarmertot
    , IFNULL(SUM(CASE WHEN dttot.entry_type_code=1 THEN 1 ELSE 0 END),0) carrytot
    , IFNULL(SUM(CASE WHEN dttot.entry_type_code=2 THEN 1 ELSE 0 END),0) newptot
    , IFNULL(ROUND(SUM(dttot.crop_area),2),0) panjiareatot
    FROM (
    SELECT DISTINCT gm.societyid,fs.entry_type_code, fs.fs_id
    ,cd.crop_area
    FROM farmer_society fs
    INNER JOIN land_details ld ON ld.fs_id=fs.fs_id
    INNER JOIN crop_details cd ON cd.fs_id=ld.fs_id AND cd.id_masterkey_khasra=ld.id_masterkey_khasra
    INNER JOIN society s ON s.society_id=fs.society_id
    INNER JOIN ganna_mapping gm ON gm.societyid=s.Society_Id
    WHERE cd.crop_code=307 
    ) dttot
    GROUP BY dttot.societyid) t2 ON t1.societyid=t2.societyid`
    let p = []
    return {query: q, params: p}
}


exports.GannaPanjiyanUserwise = () => {
    let q = `SELECT t1.user_id,t1.AEO_Name,t1.sname,t2.distpanjfarmertot,t2.carrytot,t2.newptot,t2.panjiareatot
    ,t1.distpanjfarmer,t1.carry,t1.newp,t1.panjiarea
    FROM (
    SELECT dtmas.user_id,dtmas.AEO_Name,dtmas.sname
    , IFNULL(COUNT(dtdata.fs_id),0) distpanjfarmer
    , IFNULL(SUM(CASE WHEN dtdata.entry_type_code=1 THEN 1 ELSE 0 END),0)carry
    , IFNULL(SUM(CASE WHEN dtdata.entry_type_code=2 THEN 1 ELSE 0 END),0)newp
    , IFNULL(ROUND(SUM(dtdata.buyinglimit),2),0) panjiarea
    FROM (
     (
    SELECT gm.user_id,gm.AEO_Name, GROUP_CONCAT(DISTINCT gm.societyid,'-',s.Society_Name) sname
    FROM ganna_mapping gm
    INNER JOIN society s ON gm.societyid=s.Society_Id
    GROUP BY gm.user_id,gm.AEO_Name) dtmas
    LEFT JOIN 
     (
    SELECT gp.user_id,gp.fs_id,gp.buyinglimit,fs.entry_type_code
    FROM ganna_panjiyan gp
    INNER JOIN farmer_society fs ON gp.fs_id=fs.fs_id) dtdata ON dtmas.user_id=dtdata.user_id
    )
    GROUP BY dtmas.user_id,dtmas.AEO_Name,dtmas.sname) t1
    INNER JOIN 
     (
    SELECT dttot.user_id, IFNULL(COUNT(dttot.fs_id),0) distpanjfarmertot
    , IFNULL(SUM(CASE WHEN dttot.entry_type_code=1 THEN 1 ELSE 0 END),0) carrytot
    , IFNULL(SUM(CASE WHEN dttot.entry_type_code=2 THEN 1 ELSE 0 END),0) newptot
    ,dttot.crop_area panjiareatot
    FROM (
    SELECT DISTINCT gm.user_id,fs.entry_type_code, fs.fs_id
    , SUM(cd.crop_area) crop_area
    FROM farmer_society fs
    INNER JOIN land_details ld ON ld.fs_id=fs.fs_id
    INNER JOIN crop_details cd ON cd.fs_id=ld.fs_id AND cd.id_masterkey_khasra=ld.id_masterkey_khasra
    INNER JOIN society s ON s.society_id=fs.society_id
    LEFT JOIN ganna_mapping gm ON gm.societyid=s.Society_Id
    WHERE cd.crop_code=307
    GROUP BY gm.user_id,fs.entry_type_code, fs.fs_id
    ) dttot
    GROUP BY dttot.user_id) t2 ON t1.user_id=t2.user_id`
    let p = []
    return {query: q, params: p}
}