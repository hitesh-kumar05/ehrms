let DB_SERVICE = global.DB_SERVICE;
let CONFIG_PARAMS = global.COMMON_CONFS;
const securityService = require('./securityservice.js');
const userValidations = require('../validators/uservalidator.js');
const COMMON_QUERIES = require('../queries/commonQueries.js');
let CARRY_FORWARD_QUERIES = require('../queries/carryForwardQueries.js');
let async = require('async');

let dept = {
    saveDesignationDetails: function (dbkey, request, params, sessionDetails, callback) {
        let response = {}
        async.series([
            //check validation for farmer_society
            // function (cback2) {
            //     const { value, error } = userValidations.farmerSocietyValidation(params);
            //     if (error) {
            //         return cback2({ message: `in farmer_society :- ${error.details[0].message}`, errno: 1001, uf_id: mas_farmer['uf_id'] });
            //     } else {
            //         farmer_society = value;
            //         return cback2();
            //     }
            // },
            //inserted in farmer_society
            function (cback6) {
                qAndP = DB_SERVICE.getInsertClauseWithParams(params, 'mas_desgination');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (r1 && r1.data) {
                        response= r1.data["insertId"]
                        cback6();
                        return;
                    } else {
                        cback6(e1);
                        return;
                    }
                })
            },
        ], function (err, res) {
            return callback(err, response)
        })
    },


    saveOfficeLevelDetails: function (dbkey, request, params, sessionDetails, callback) {
        let response = {}
        async.series([
            //check validation for farmer_society
            // function (cback2) {
            //     const { value, error } = userValidations.farmerSocietyValidation(params);
            //     if (error) {
            //         return cback2({ message: `in farmer_society :- ${error.details[0].message}`, errno: 1001, uf_id: mas_farmer['uf_id'] });
            //     } else {
            //         farmer_society = value;
            //         return cback2();
            //     }
            // },
            //inserted in farmer_society
            function (cback6) {
                qAndP = DB_SERVICE.getInsertClauseWithParams(params, 'mas_office_level');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (r1 && r1.data) {
                        response= r1.data["insertId"]
                        cback6();
                        return;
                    } else {
                        cback6(e1);
                        return;
                    }
                })
            },
        ], function (err, res) {
            return callback(err, response)
        })
    },

    saveOfficeTypeDetails: function (dbkey, request, params, sessionDetails, callback) {
        let response = {}
        async.series([
            //check validation for farmer_society
            // function (cback2) {
            //     const { value, error } = userValidations.farmerSocietyValidation(params);
            //     if (error) {
            //         return cback2({ message: `in farmer_society :- ${error.details[0].message}`, errno: 1001, uf_id: mas_farmer['uf_id'] });
            //     } else {
            //         farmer_society = value;
            //         return cback2();
            //     }
            // },
            //inserted in farmer_society
            function (cback6) {
                qAndP = DB_SERVICE.getInsertClauseWithParams(params, 'mas_office_type');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (r1 && r1.data) {
                        response= r1.data["insertId"]
                        cback6();
                        return;
                    } else {
                        cback6(e1);
                        return;
                    }
                })
            },
        ], function (err, res) {
            return callback(err, response)
        })
    },
    
    saveOfficeDetails: function (dbkey, request, params, sessionDetails, callback) {
        let response = {}
        async.series([
            //check validation for farmer_society
            // function (cback2) {
            //     const { value, error } = userValidations.farmerSocietyValidation(params);
            //     if (error) {
            //         return cback2({ message: `in farmer_society :- ${error.details[0].message}`, errno: 1001, uf_id: mas_farmer['uf_id'] });
            //     } else {
            //         farmer_society = value;
            //         return cback2();
            //     }
            // },
            //inserted in farmer_society
            function (cback6) {
                qAndP = DB_SERVICE.getInsertClauseWithParams(params, 'mas_office_details');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (r1 && r1.data) {
                        response= r1.data["insertId"]
                        cback6();
                        return;
                    } else {
                        cback6(e1);
                        return;
                    }
                })
            },
        ], function (err, res) {
            return callback(err, response)
        })
    },
}

module.exports = dept;