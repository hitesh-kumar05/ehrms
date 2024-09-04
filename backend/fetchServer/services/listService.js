var DB_SERVICE = global.DB_SERVICE;
var securityService = require('./securityservice.js');
var LIST_QUERIES = require('../queries/listQueries.js');
var async = require('async');
var CONFIG_PARAMS = global.COMMON_CONFS;

let lists = {
    carryForwardList: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.society_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails()
        let society_id = +params["society_id"];
        let search_by = +params["type"] ?? 0;
        let searchWith = params["search"];
        let village_code = +params["village_code"];
        const offset = +params['page'] | 0;
        const limit = +params['size'];
        const from = offset * limit;
        const to = limit;
        let qAndParamArray = LIST_QUERIES.getCarryForwardFarmerListForSocietyQueryParamObjArray(society_id, search_by, searchWith, village_code, from, to);
        DB_SERVICE.executeMultiSelQueriesWithParameters(dbkey, qAndParamArray, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            return callback(null, { "data": r1.data[0], "total": r1.data[1][0]["total"] });
        });
    },
    trust_carryForwardList: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.society_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails()
        let society_id = +params["society_id"];
        let farmer_code = params["farmer_code"];
        const offset = +params['page'] | 0;
        const limit = +params['size'];
        const from = offset * limit;
        const to = limit;
        let qAndParamArray = LIST_QUERIES.getTrustCarryForwardFarmerListForSocietyQueryParamObjArray(society_id, farmer_code, from, to);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndParamArray.query, qAndParamArray.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            return callback(null, r1.data);
        });
    },
    farmerListBySociety: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.society_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        const { society_id, type = 0, search, village_code, page = 0, size } = params
        const from = page * size;
        let qAndParamArray = LIST_QUERIES.getFarmerListBySocietyQueryParamObj(society_id);
        DB_SERVICE.executeMultiSelQueriesWithParameters(dbkey, qAndParamArray, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            return callback(null, r1.data);
        });
    },
    farmerListByTehsil: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.district_id && params.tehsil_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        const { type = 0, search, village_code, page = 0, size, district_id, tehsil_id } = params
        const from = page * size;
        let qAndParamArray = LIST_QUERIES.getFarmerListByTehsilQueryParamObj(district_id, tehsil_id, +type, search, village_code, from, size);
        DB_SERVICE.executeMultiSelQueriesWithParameters(dbkey, qAndParamArray, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            return callback(null, { "data": r1.data[0], "total": r1.data[1][0]["total"] });
        });
    },
    farmerListForDeletionBySociety: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.society_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        const { society_id } = params;
        let farmerList = {}, qAndParamObj = {};
        async.series([
            // get new entry farmer
            function (cback1) {
                qAndParamObj = LIST_QUERIES.getNewEntryFarmerListBySocietyQueryParamObj(society_id);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParamObj.query, qAndParamObj.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    farmerList['new_database'] = r1.data
                    return cback1(null);
                });
            },
            // get farmer except deleted from base database
            function (cback1) {
                qAndParamObj = LIST_QUERIES.getBaseNotDeletedFarmerListBySocietyQueryParamObj(society_id);
                DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getWorkingBaseDBDetails(), qAndParamObj.query, qAndParamObj.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    farmerList['base_database'] = r1.data
                    return cback1(null);
                });
            }
        ], function (err, res) {
            return callback(err, farmerList)
        })
    },
    farmerListForDeletionByTehsil: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.district_id && params.tehsil_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        const { type = 0, search, village_code, page = 0, size, district_id, tehsil_id, isNewFarmer } = params
        const from = page * size;
        if (isNewFarmer == "Y") {
            dbkey = CONFIG_PARAMS.getWorkingDBDetails();
        }
        else {
            dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails();
        }
        let qAndParamArray = LIST_QUERIES.getDeleteReqFarmerListByTehsilQueryParamObj(district_id, tehsil_id, +type, search, village_code, from, size, isNewFarmer);
        DB_SERVICE.executeMultiSelQueriesWithParameters(dbkey, qAndParamArray, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            return callback(null, { "data": r1.data[0], "total": r1.data[1][0]["total"] });
        });
    },
    farmerListForVerificationByRaeo: function (dbkey, request, params, sessionDetails, callback) {
        let type = +params["type"];
        let raeo_id = +params["user_id"];
        let page = +params["page"];
        let size = +params["size"];
        let search_with = +params["search_with"];
        let search = params["search"];
        let village_code = +params["village_code"]
        let offset = page * size;
        let qAndPArr = LIST_QUERIES.getFarmerListForVerificationByRaeoQueryParamObj(raeo_id, offset, size, type, search_with, search, village_code);
        DB_SERVICE.executeMultiSelQueriesWithParameters(dbkey, qAndPArr, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else {
                return callback(null, { "data": r1.data[0], "total": r1.data[1][0]["TOTAL"] });
            }
        })
    },
    AllfarmerListForSashodhanVerificationByRaeo: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id && (params.page == 0 || params.page) && params.size)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let { user_id, page, size, search_with, search, village_code } = params;
        let offset = page * size;
        let qAndPArr = LIST_QUERIES.AllfarmerListForSashodhanVerificationByRaeoQandPObj(user_id, offset, size, search_with, search, village_code);
        DB_SERVICE.executeMultiSelQueriesWithParameters(dbkey, qAndPArr, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else {
                return callback(null, { "data": r1.data[0], "total": r1.data[1][0]["TOTAL"] });
            }
        })
    },
    farmerListForSanshodhanBySADO: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id && (params.page == 0 || params.page) && params.size && params.type && (params.type == 1 || params.type == 2 || params.type == 3)
            && params.subdistrict_code)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        const { type, user_id, subdistrict_code, page, size, search_with, search, village_code } = params;
        let offset = page * size;
        let qAndPArr = LIST_QUERIES.getFarmerListForSanshodhanBySADO(+subdistrict_code, +offset, +size, +type, search_with, search, +village_code);
        DB_SERVICE.executeMultiSelQueriesWithParameters(dbkey, qAndPArr, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else {
                return callback(null, { "data": r1.data[0], "total": r1.data[1][0]["TOTAL"] });
            }
        })
    },
    farmerListToGetAadharBySociety: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.society_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let qAndParamObj = LIST_QUERIES.getfarmerListToGetAadharBySocietyQAndP(+params.society_id);
        DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getWorkingBaseDBDetails(), qAndParamObj.query, qAndParamObj.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else{
                return callback(null, r1.data);
            }
        });
    }
}

module.exports = lists




