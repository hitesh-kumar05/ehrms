var async = require('async');
const userValidations = require('../validators/uservalidator.js');

let food_s = {
    /////////////////////////////village shifting/////////////////////////////////////////////
    // update society id of whole village farmers
    // basically whole village is transfer to other society
    updateSocietyIdOfArr: function (dbkey, request, params, sessionDetails, callback) {
        let farmer_arr = params, failed_list = [], ip;
        if (request.headers['x-forwarded-for']) {
            ip = request.headers['x-forwarded-for'].split(",")[0];
            sessionDetails["ip_address"] = ip;
        } else if (request.connection && request.connection.remoteAddress) {
            ip = request.connection.remoteAddress;
            sessionDetails["ip_address"] = ip;
        } else {
            ip = request.ip;
            sessionDetails["ip_address"] = ip;
        }
        sessionDetails["user_id"] = 7777;//for food api
        async.eachSeries(farmer_arr, function (farmer, cb) {
            food_s.updateSocietyId(dbkey, request, farmer, sessionDetails, function (err, res) {
                if (err) {
                    failed_list.push({ "message": `${err.message ?? err} `, "farmer_code": farmer['FarmerCode'] })
                    return cb();
                } else {
                    return cb();
                }
            })
        }, function (err, res) {
            return callback(null, { "status": "1", "msg": 'SUCCESS', "failed_count": failed_list.length, "failed_list": failed_list })

        })
    },

    updateSocietyId : function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, qAndP = {}, whereObj = {}, updateObj = {};
        farmer = params
        async.series([
            function (cback0) {
                DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                    tranObj = tranobj;
                    tranCallback = trancallback;
                    dbkey = { dbkey: dbkey, connectionobj: tranObj };
                    return cback0(err);
                })
            },
            function (cback2) {
                async.series([
                    function (cback1) {
                        const { error, value } = userValidations.villageShiftingApiValidation(farmer)
                        if (error) {
                            return cback1(`in request body :- ${error.details[0].message}`);
                            
                        } else {
                            body = value;
                            return cback1();
                        }
                    },
    
                    // insert into app log
                    function (cback2) {
                        insertAllDataInLogTable(dbkey, request, body, sessionDetails, function (err, res) {
                            if (err) {
                                return cback2(err)
                            } else {
                                return cback2()
                            }
                        })
                    },
                    //update society  in farmer_society of both database
                    function (cback4) {
                        updateSocietyOnFarmerSociety_bothDatabase(dbkey, request, body, sessionDetails, function (err, res) {
                            if (err) {
                                return cback4(err)
                            } else {
                                return cback4()
                            }
                        })
                    },
                    //update society in land  and crop Tables of both database
                    function (cback5) {
                        updateSocietyLandAndCrop_bothDatabase(dbkey, request, body, sessionDetails, function (err, res) {
                            if (err) {
                                return cback5(err)
                            } else {
                                return cback5()
                            }
                        })
                    },
                    //update society in farmerrepresentative Tables of both database
                    function (cback5) {
                        updateFarmerRepresentative_bothDatabase(dbkey, request, body, sessionDetails, function (err, res) {
                            if (err) {
                                return cback5(err)
                            } else {
                                return cback5()
                            }
                        })
                    },
                    // update SocietyDetailsMapped table on bothDatabase
                    function (cback6) {
                        body['NewVlocationCode'] = body['VlocationCode']
                        updateSocietyDetailsMapped_bothDatabase(dbkey, request, body, sessionDetails, function (err, res) {
                            return cback6(err, res)
                        })
                    }
                ], function (err, res) {
                    return cback2(err)
                })
            },
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                    errServeice.saveErrToDB(request.query.dbkey, err, 'villageShiftingApi', sessionDetails, function (err1, res1) {
                        return callback(err)
                    })
                })
    
            }
            else {
                console.log('test completed');
                // DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                //     return callback(null, { "status": "SUCCESS" })
                // })
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null)
                });
            }
        })
    }
}
 