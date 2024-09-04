var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var securityService = require('./securityservice.js');
var MASTER_QUERIES = require('../queries/masterQueries.js');
var async = require('async');

let master = {

    getAllDesignation: function (dbkey, request, params, sessionDetails, callback) {
        let qAndpObj = MASTER_QUERIES.getAllDesignationQueryParamObj();
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },
//////////making API for cast//////////
    getAllCaste: function (dbkey, request, params, sessionDetails, callback) {
        let qAndpObj = MASTER_QUERIES.getAllCasteQueryParamObj();////query name should be same 
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

//////////making API for //////////
getAllReligion: function (dbkey, request, params, sessionDetails, callback) {
    let qAndpObj = MASTER_QUERIES.getAllReligionQueryParamObj();////query name should be same 
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
        return callback(e1, r1 ? r1.data : []);
    })
},

getAllOfficeLevel: function (dbkey, request, params, sessionDetails, callback) {
    let qAndpObj = MASTER_QUERIES.getAllOfficeLevelQueryParamObj();////query name should be same 
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
        return callback(e1, r1 ? r1.data : []);
    })
},

getAllOfficeType: function (dbkey, request, params, sessionDetails, callback) {
    let qAndpObj = MASTER_QUERIES.getAllOfficeTypeQueryParamObj();////query name should be same 
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
        return callback(e1, r1 ? r1.data : []);
    })
},

getAllDistricts: function (dbkey, request, params, sessionDetails, callback) {
    let qAndpObj = MASTER_QUERIES.getAllDistrictsQueryParamObj();////query name should be same 
    console.log(qAndpObj+"");
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
        return callback(e1, r1 ? r1.data : []);
    })
},

getAllBlock: function (dbkey, request, params, sessionDetails, callback) {
    let qAndpObj = MASTER_QUERIES.getAllBlockQueryParamObj();////query name should be same 
    console.log(qAndpObj+"");
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
        return callback(e1, r1 ? r1.data : []);
    })
},

getBlockByDistrict: function (dbkey, request, params, sessionDetails, callback) {
    if(!params.district_code) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
    let qAndpObj = MASTER_QUERIES.getBlockByDistQueryParamObj(params.district_code);////query name should be same 
    console.log(qAndpObj+"");
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
        return callback(e1, r1 ? r1.data : []);
    })
},

getOfficeDetails: function (dbkey, request, params, sessionDetails, callback) {
    let qAndpObj = MASTER_QUERIES.getOfficeDetailsReportQueryParamObj(params.district_code);////query name should be same 
    console.log(qAndpObj+"");
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
        return callback(e1, r1 ? r1.data : []);
    })
},

getOfficeTypeDetails: function (dbkey, request, params, sessionDetails, callback) {
    let qAndpObj = MASTER_QUERIES.getAllOfficeTypeQueryParamObj(params.district_code);////query name should be same 
    console.log(qAndpObj+"");
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
        return callback(e1, r1 ? r1.data : []);
    })
},


    getMenuByUser: function (dbkey, request, params, sessionDetails, callback) {
        if (!params.user_type) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        let main_menu = [];
        let sub_menu = [];
        let qAndpObj = MASTER_QUERIES.getMenuByUserQueryParamObj(params.user_type);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, function (e1, r1) {
            if (r1 && r1.data) {
                main_menu = r1.data.filter(function (e) {
                    return (e["children"] == 0)
                })
                async.eachSeries(main_menu, function (m, cb) {
                    sub_menu = [];
                    sub_menu = r1.data.filter(function (e) {
                        return (e["mainmenuCode"] == m["menuCode"])
                    })
                    if (sub_menu.length > 0) {
                        sub_menu.sort(async function (a, b) {
                            return a["menuOrder"] - b["menuOrder"]
                        });
                    }
                    m["child"] = sub_menu;
                    return cb();
                }, function (err, res) {
                    callback(err, main_menu);
                })
            } else {
                callback(e1);
            }
        })
    },

    getAllDistrict: function (dbkey, request, params, sessionDetails, callback) {
        let qAndpObj = MASTER_QUERIES.getAllDistrictQueryParamObj();
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    // getBlockByDistrict: function (dbkey, request, params, sessionDetails, callback) {
    //     if (!params.district_id) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
    //     let qAndpObj = MASTER_QUERIES.getBlockByDistrictQueryParamObj(params.district_id);
    //     DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
    //         return callback(e1, r1 ? r1.data : []);
    //     })
    // },

    getTehsilByDistrict: function (dbkey, request, params, sessionDetails, callback) {
        if (!params.district_id) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let qAndpObj = MASTER_QUERIES.getTehsilByDistrictQueryParamObj(params.district_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    getVillageByDistrictAndTehsil: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.district_id && params.tehsil_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let qAndpObj = MASTER_QUERIES.getVillageByDistrictAndTehsilQueryParamObj(params.district_id, params.tehsil_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    getMasCasteWithSubCaste: function (dbkey, request, params, sessionDetails, callback) {
        let qAndParam = {}, mas_caste = [], mas_caste_send = [];
        async.series([
            function (cback1) {
                qAndParam = MASTER_QUERIES.getMasCasteQueryParamObj();
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else {
                        mas_caste = r1.data;
                        return cback1();
                    }
                })
            },
            function (cback2) {
                async.eachSeries(mas_caste, function (caste, cb1) {
                    let casteCode = +caste["caste_code"] ?? 0;
                    let obj = { ...caste }
                    qAndParam = MASTER_QUERIES.getMasSubCasteQueryParamObj(casteCode);
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                        if (e1) {
                            return cb1(e1);
                        }
                        else {
                            obj["SubCasteData"] = r1.data;
                            mas_caste_send.push({ ...obj });;
                            return cb1();
                        }
                    })
                }, function (err, res) {
                    if (err) {
                        return cback2(err);
                    }
                    else {
                        return cback2();
                    }
                })
            }
        ], function (e, r) {
            if (e) {
                return callback(e);
            }
            else {
                return callback(null, mas_caste_send);
            }
        })
    },

    getNomineeRelation: function (dbkey, request, params, sessionDetails, callback) {
        let qAndpObj = MASTER_QUERIES.getMasRelationQueryParamObj();
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    getVillageListBySociety: function (dbkey, request, params, sessionDetails, callback) {
        if (!params.society_id) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let qAndpObj = MASTER_QUERIES.getVillageListBySocietyQueryParamObj(+params["society_id"]);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    getAllBanks: function (dbkey, request, params, sessionDetails, callback) {
        let qAndpObj = MASTER_QUERIES.getAllBanksQueryParamObj();
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    getBankBranchByDistrictAndBank: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.district_id && params.bank_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let qAndpObj = MASTER_QUERIES.getBankBranchByDistrictAndBankQueryParamObj(params["district_id"], params["bank_id"]);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    getSocietyList: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.whereKey && params.district_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let whereKey = params["whereKey"]; // if 2 then tehsil , if 1 then district;
        let district_id = params["district_id"];
        let tehsil_id = params["tehsil_id"] ?? null;
        let qAndPObj = MASTER_QUERIES.getSocietyListQueryParamObj(whereKey, district_id, tehsil_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndPObj.query, qAndPObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    getAllCrop: function (dbkey, request, params, sessionDetails, callback) {
        let qAndPObj = MASTER_QUERIES.getAllCropQueryParamObj();
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndPObj.query, qAndPObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },

    getOfficerVillageListByUserId: function (dbkey, request, params, sessionDetails, callback) {
        let user_id = +params["user_id"];
        let qAndPObj = MASTER_QUERIES.getAllVillagesOfUserId(user_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndPObj.query, qAndPObj.params, (e1, r1) => {
            return callback(e1, r1 ? r1.data : []);
        })
    },
    getAllSocietyListByBankId: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let user_id = +params["user_id"];
        let qAndpObj = MASTER_QUERIES.getAllSocietyListByBankIdQueryParam(user_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, function (e, r) {
            if (e) {
                return callback(e);
            }
            else {
                return callback(null, r.data);
            }
        })
    },
    BlockOfficerListUsingDistrictID: (dbkey, request, params, sessionDetails, callback) => {
        if (!(params.district_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let district_id = +params["district_id"];
        let qAndPArr = MASTER_QUERIES.BlockOfficerListUsingDistrictID(district_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndPArr.query, qAndPArr.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else {
                return callback(null, r1.data);
            }
        })
    },
    getAllCOOPBanks: (dbkey, request, params, sessionDetails, callback) => {
        let qAndP = MASTER_QUERIES.getAllCOOPBanksQandP();
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else {
                return callback(null, r1.data);
            }
        })
    },
    getMasDivison: function (dbkey, request, params, sessionDetails, callback) {
        let qAndP = MASTER_QUERIES.getMasDivisonQueryParam()
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, (err, res) => {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, res.data);
            }
        });
    },
    getSubDistrictListByDist: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.district_LGD)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let dist_LGD_code = +params["district_LGD"];
        let qAndP = MASTER_QUERIES.getSubDistrictListByDistQPObj(+dist_LGD_code);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, (err, res) => {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, res.data);
            }
        });
    },

    getSubDistrictListByDistId: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.dist_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let dist_id = +params["dist_id"];
        let qAndP = MASTER_QUERIES.getSubDistrictListByDistIdQPObj(+dist_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, (err, res) => {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, res.data);
            }
        });
    },
    getOfficerListByDistrictID: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.district_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let { district_id, block, search, type } = params;
        console.log(dbkey, "DB");
        let qAndParam = MASTER_QUERIES.getOfficerListByDistrictIdQueryParamObj(+district_id, +block, +type, search);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else {
                return callback(null, r1.data);
            }
        })
    }

}
module.exports = master