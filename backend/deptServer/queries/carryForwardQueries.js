module.exports.checkExistingFarmerInUFPDBQueryParamObj = (uf_id) => {
    return ({ query: `select * from mas_farmer mf where mf.uf_id = ? `, params: [uf_id] })
}

module.exports.checkUfInMapTblQueryParamObj =(uf_id)=>{
    return ({ query: `select * from farmer_scheme_mapping fsm where fsm.uf_id = ? and fsm.scheme_id = 1`, params: [uf_id] })
}

module.exports.checkExistingUfInNewDBQueryParamObj = function (uf_id) {
    let q = `SELECT * FROM mas_farmer mf WHERE mf.uf_id = ?`;
    let p = [uf_id];
    return { query: q, params: p };
}
