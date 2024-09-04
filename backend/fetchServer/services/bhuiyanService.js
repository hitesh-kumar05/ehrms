var soap = require('soap');
var async = require('async');
var securityService = require('./securityservice.js');
let bhuiyan_url = 'https://bhuiyan.cg.nic.in/GetSoilDetails.asmx?wsdl';
let { checkValidOwnerTypeAndName } = require('../validators/uservalidator.js')


let bhuiyan = {
    callSoapApi: (url, function_name, xmlPayload) => {
        return new Promise((resolve, reject) => {
            soap.createClient(url, (err, client) => {
                if (err) {
                    reject(err);
                    return;
                }
                client[function_name](xmlPayload, (err, result) => {
                    //console.log(err, result);
                    if (err) {
                        reject(err);
                        return;
                    }
                    return resolve(result);
                });
            });
        });
    },
    getBhuiyanDataForLand: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.village_code && params.khasra_no)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let { village_code, khasra_no, type = 1 } = params;
        let all_khasra_detail_arr = [];
        async.series([
            function (cback0) {
                try {
                    let SOAP_XML_PAYLOAD = { VillageCensuscode: village_code, KhasraNo: khasra_no, deptid: 'fooddept', key: 'food@^652!192' }
                    Promise.race([
                        bhuiyan.callSoapApi(bhuiyan_url, 'GetSoilDetailsWSJSon', SOAP_XML_PAYLOAD),
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                reject(new Error('API_TIMEOUT_ERROR'));
                            }, 10000);
                        }),
                    ])
                        .then((response) => {
                            let string = JSON.stringify(response);
                            let objectValue = JSON.parse(string);
                            all_khasra_detail_arr = JSON.parse(objectValue["GetSoilDetailsWSJSonResult"]);
                            if (all_khasra_detail_arr[0].Status && all_khasra_detail_arr[0].Status == 0) {
                                all_khasra_detail_arr = []
                                //return cback0()
                                return cback0({ message: 'No Khasra Found', errno: 1051 });
                            }
                            if (type && type == 2) {
                                all_khasra_detail_arr = all_khasra_detail_arr.filter(function (e) {
                                    return (e.VillageCensus == village_code && e.Khasra_No == khasra_no)
                                });
                            }
                            return cback0();
                        })
                        .catch((error) => {
                            let e;
                            if (error.message == 'API_TIMEOUT_ERROR') {
                                e = { "message": 'API_TIMEOUT_ERROR' }
                                return cback0(e);
                            }
                            else {
                                e = error;
                                return cback0(e);
                            }
                        });
                } catch (error) {
                    return cback0(error);
                }
            },
        ], function (err, res) {
            if (err) {
                return callback(err)
            } else {
                return callback(null, all_khasra_detail_arr);
            }
        })
    },
    // get land from bhuiyan with owner name and district check
    getBhuiyanDataForLandWithCheck: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.village_code && params.khasra_no)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);

        let all_khasra_detail_arr = [], unique_vill_khasra_arr = [];
        async.series([
            function (cback0) {
                bhuiyan.getBhuiyanDataForLand(dbkey, request, params, sessionDetails, (err, res) => {
                    if (err) {
                        return cback0(err)
                    } else {
                        all_khasra_detail_arr = res
                        return cback0()
                    }
                })
            },
            function (cback1) {
                async.eachSeries(all_khasra_detail_arr, function (data, cb11) {
                    let c = unique_vill_khasra_arr.filter(function (e) {
                        return (e.VillageCensus == data.VillageCensus && e.Khasra_No == data.Khasra_No)
                    })
                    if (c.length == 1) {
                        return cb11()
                    }
                    else {
                        unique_vill_khasra_arr.push(data);
                        return cb11()
                    }
                }, function (err111, res111) {
                    if (err111) {
                        return cback1(err111)
                    }
                })
                async.eachSeries(unique_vill_khasra_arr, function (data, cb) {
                    let current_khasra_detail = all_khasra_detail_arr.filter(function (e) {
                        return (e.VillageCensus == data.VillageCensus && e.Khasra_No == data.Khasra_No)
                    });
                    OwnerName_str = current_khasra_detail.reduce((accumulator, currentValue) => accumulator + currentValue['OwnerName'], ' ');
                    if (OwnerName_str.length > 240) {
                        OwnerName_str = OwnerName_str.substring(0, 240)
                    }
                    data['OwnerName'] = OwnerName_str
                    async.series([
                        function (cback1) {
                            if (sessionDetails['rev_district_id'] == data['Distcode']) {
                                checkValidOwnerTypeAndName(+data['OwnerTypeCode'], data['OwnerName'], +data['MutationReasonId'], +data['jodtId'], function (err, res) {
                                    data['invalid'] = res == true ? 0 : 1
                                    // data['invalid'] = 1;
                                    return cback1()
                                })
                            } else {
                                data['invalid'] = 1
                                data['Reason'] = 'अन्य जिले की भूमि ';
                                return cback1()
                            }

                        }
                    ], function (err, res) {
                        if (+data['OwnerTypeCode'] == 6) {
                            data["type"] = "VP";
                        }
                        else {
                            data['type'] = 'RG'
                        }
                        data['flag_varis_land'] = 0//added
                        return cb();
                    })
                }, function (err, res) {
                    if (err) {
                        return cback1({ message: 'error on combining owner name' });
                    } else {
                        return cback1(null, unique_vill_khasra_arr);
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err)
            } else {
                return callback(null, unique_vill_khasra_arr);
            }
        })
    },
    // for only district check
    getBhuiyanDataForLandWithDistCheck: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.village_code && params.khasra_no)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);

        let all_khasra_detail_arr = [], unique_vill_khasra_arr = [];
        async.series([
            function (cback0) {
                bhuiyan.getBhuiyanDataForLand(dbkey, request, params, sessionDetails, (err, res) => {
                    if (err) {
                        return cback0(err)
                    } else {
                        all_khasra_detail_arr = res
                        return cback0()
                    }
                })
            },
            function (cback1) {
                async.eachSeries(all_khasra_detail_arr, function (data, cb11) {
                    let c = unique_vill_khasra_arr.filter(function (e) {
                        return (e.VillageCensus == data.VillageCensus && e.Khasra_No == data.Khasra_No)
                    })
                    if (c.length == 1) {
                        return cb11()
                    }
                    else {
                        unique_vill_khasra_arr.push(data);
                        return cb11()
                    }
                }, function (err111, res111) {
                    if (err111) {
                        return cback1(err111)
                    }
                })
                async.eachSeries(unique_vill_khasra_arr, function (data, cb) {
                    let current_khasra_detail = all_khasra_detail_arr.filter(function (e) {
                        return (e.VillageCensus == data.VillageCensus && e.Khasra_No == data.Khasra_No)
                    });
                    OwnerName_str = current_khasra_detail.reduce((accumulator, currentValue) => accumulator + currentValue['OwnerName'], ' ');
                    if (OwnerName_str.length > 240) {
                        OwnerName_str = OwnerName_str.substring(0, 240)
                    }
                    data['OwnerName'] = OwnerName_str
                    async.series([
                        function (cback1) {
                            if (sessionDetails['rev_district_id'] == data['Distcode']) {
                                return cback1()
                            } else {
                                data['invalid'] = 1
                                data['Reason'] = 'अन्य जिले की भूमि ';
                                return cback1()
                            }
                        },
                        function (cback2) {
                            if (data['jodtId'] == 3) {
                                data['invalid'] = 0
                                return cback2()
                            } else {
                                data['invalid'] = 1
                                data['Reason'] = 'जोत का प्रकार संस्था नहीं है';
                                return cback2()
                            }
                        }
                    ], function (err, res) {
                        if (+data['OwnerTypeCode'] == 6) {
                            data["type"] = "VP";
                        }
                        else {
                            data['type'] = 'RG'
                        }
                        data['flag_varis_land'] = 0//added
                        
                        return cb();
                    })
                }, function (err, res) {
                    if (err) {
                        return cback1({ message: 'error on combining owner name' });
                    } else {
                        return cback1(null, unique_vill_khasra_arr);
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err)
            } else {
                return callback(null, unique_vill_khasra_arr);
            }
        })
    },
    getGirdawariDataForLand: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.village_code && params.khasra_no)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let { village_code, khasra_no } = params;
        let girdawari_detail_arr = [];
        async.series([
            function (cback0) {
                try {
                    let SOAP_XML_PAYLOAD = { VillageCensuscode: village_code, KhasraNo: khasra_no, deptid: 'fooddept', key: 'food@^652!192' }
                    Promise.race([
                        bhuiyan.callSoapApi(bhuiyan_url, 'GetCropDetailWSJSon', SOAP_XML_PAYLOAD),
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                reject(new Error('API_TIMEOUT_ERROR'));
                            }, 10000);
                        }),
                    ])
                        .then((response) => {
                            let string = JSON.stringify(response);
                            let objectValue = JSON.parse(string);
                            girdawari_detail_arr = JSON.parse(objectValue["GetCropDetailWSJSonResult"]);
                            if (girdawari_detail_arr[0].Status && girdawari_detail_arr[0].Status == 0) {
                                girdawari_detail_arr = []
                            }
                            return cback0();
                        })
                        .catch((error) => {
                            let e;
                            if (error.message == 'API_TIMEOUT_ERROR') {
                                e = { "message": 'API_TIMEOUT_ERROR' }
                                return cback0(e);
                            }
                            else {
                                e = error;
                                return cback0(e);
                            }
                        });
                } catch (error) {
                    return cback0(error);
                }
            },
        ], function (err, res) {
            if (err) {
                return callback(err)
            } else {
                return callback(null, girdawari_detail_arr);
            }
        })
    },
}

module.exports = bhuiyan
