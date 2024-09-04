var DB_SERVICE = global.DB_SERVICE;
var securityService = require('./securityservice.js');
var bhuiyanService = require('./bhuiyanService.js');
var FARMER_QUERIES = require('../queries/farmerQueries.js');
var req = require('request');
var async = require('async');
let config = require('config');
var CONFIG_PARAMS = global.COMMON_CONFS;
let aadharToARefUrl = config.get('apiUrlGetRefIdByAadhar'); //`http://10.132.36.237:3102/otherApi24/aadhar/post/getRefIdByAadhar`;
let max_nominee_count = config.get('max_nominee_count');
const { format } = require('date-fns');

var farmer = {
    getFarmerBasicAndlandDetails_Base: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.searchColumn && params.searchValue1)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails()
        let searchColumn = +params["searchColumn"];
        let searchValue1 = params["searchValue1"];
        let searchValue2 = params["searchValue2"] ?? '';
        let qAndParam = {};
        let uf_id = 0, fs_id = 0, basic_details = [], land_details = [];

        async.series([
            function (cback1) {
                qAndParam = FARMER_QUERIES.getFarmerBasicDetail_Base_QueryParamObj(+searchColumn, searchValue1, searchValue2);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else if (r1 && r1.data && r1.data.length > 0) {
                        uf_id = +r1.data[0]["uf_id"];
                        fs_id = +r1.data[0]["fs_id"];
                        basic_details = r1.data;
                        return cback1(null, r1.data[0]);
                    }
                    else {
                        return cback1(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
                    }
                })
            },
            function (cback2) {
                qAndParam = FARMER_QUERIES.getFarmerLandDetails_Base_QueryParamObj(searchColumn, searchValue1, searchValue2);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback2(e1);
                    }
                    else {
                        land_details = r1.data;
                        return cback2(null, r1.data);
                    }
                })
            },

            function (cback3) {
                qAndParam = FARMER_QUERIES.getFarmerLandDetailsForest_Base_QueryParamObj(searchColumn, searchValue1, searchValue2);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback3(e1);
                    }
                    else {
                        return cback3(null, r1.data);
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, {
                    "basic_details": res[0],
                    "land_details": res[1],
                    "land_details_forest": res[2]
                });
            }
        })
    },
    getLandFromBhuiyanWithAvailablityCheck: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.village_code && params.khasra_no && params.fs_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let landArray = []
        async.series([
            // get land from bhuiyan with owner name and district check
            function (cback1) {
                bhuiyanService.getBhuiyanDataForLandWithCheck(dbkey, request, params, sessionDetails, (err, res) => {
                    if (err) {
                        return cback1(err)
                    }
                    landArray = res
                    return cback1()
                })
            },
            // check land availablity in old and new database
            function (cback2) {
                farmer.checkLandIsAvailable(dbkey, request, { landArray, fs_id: params.fs_id }, sessionDetails, (err, res) => {
                    if (err) {
                        return cback2(err)
                    } else {
                        landArray = res
                        return cback2()
                    }
                })
            }
        ], function (err, res) {
            return callback(err, landArray)
        })
    },
    getTrustLandFromBhuiyanWithAvailablityCheck: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.village_code && params.khasra_no && params.farmer_code)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: ' in getTrustLandFromBhuiyanWithAvailablityCheck MANDATORY_FIELDS_ARE_MISSING' });
        let landArray = []
        async.series([
            // get land from bhuiyan with district check
            function (cback1) {
                bhuiyanService.getBhuiyanDataForLandWithDistCheck(dbkey, request, params, sessionDetails, (err, res) => {
                    if (err) {
                        return cback1(err)
                    }
                    landArray = res
                    landArray = landArray.map(function (e) {
                        return { ...e, type: 'RG' }
                    })
                    return cback1()
                })
            },
            // check land availablity in old and new database
            function (cback2) {
                farmer.checkLandIsAvailable(dbkey, request, { landArray, fs_id: params.farmer_code }, sessionDetails, (err, res) => {
                    if (err) {
                        return cback2(err)
                    } else {
                        landArray = res
                        return cback2()
                    }
                })
            }
        ], function (err, res) {
            return callback(err, landArray)
        })
    },
    getBothGirdawariDataForLand: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.land_details)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let insertObj = {}, resToSend = [];
        async.eachSeries(params['land_details'], function (land, cb) {
            let village_code = land['VillageCensus'] ?? land['village_code'];
            let khasra_no = land['Khasra_No'] ?? land['khasra_no'];
            let village_type = land['type']
            let obj = land, new_gir_crop_arr, old_gir_crop_arr;
            obj["new_crop"] = [];
            obj["old_crop"] = [];
            async.series([
                function (cback1) {
                    bhuiyanService.getGirdawariDataForLand(dbkey, request, { village_code, khasra_no }, sessionDetails, function (err, res) {
                        if (err) {
                            return cback1({ message: `girdawari api error -${err}` })
                        }
                        async.eachSeries(res, function (gir_crop_row, cb1) {
                            if (gir_crop_row['SubCropCode'] == 0) {
                                return cb1()
                            } else {
                                insertObj = {}
                                insertObj['village_code'] = gir_crop_row['VillageCensus']
                                insertObj['khasra_no'] = gir_crop_row['Khasra_No']
                                insertObj['crop_code'] = gir_crop_row['SubCropCode']
                                insertObj['crop_area'] = gir_crop_row['SubCropArea']
                                insertObj['crop_name'] = gir_crop_row['SubCropName']
                                insertObj['village_name'] = gir_crop_row['VillageName']
                                insertObj['village_id'] = gir_crop_row['VillageID']
                                insertObj['crop_year'] = gir_crop_row['CropYear']
                                insertObj['crop_season'] = gir_crop_row['CropSeason']
                                insertObj['girdawari_status'] = 'Y'
                                insertObj['status'] = 'OC'
                                insertObj['type'] = village_type
                                obj["new_crop"].push({ ...insertObj });
                                cb1();
                            }
                        }, function (err, res) {
                            return cback1(err)
                        })
                    })
                },
                function (cback2) {
                    let qAndP = FARMER_QUERIES.getOldGirdawariQueryParamObj(village_code, khasra_no)
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                        if (err) {
                            return cback2(err)
                        } else {
                            async.eachSeries(res.data, function (gir_crop_row, cb1) {
                                insertObj = {}
                                insertObj['village_code'] = gir_crop_row['VillageLGCode']
                                insertObj['khasra_no'] = gir_crop_row['KhasraNo']
                                insertObj['crop_code'] = gir_crop_row['SubCropCode']
                                insertObj['crop_area'] = gir_crop_row['CropArea']
                                insertObj['village_name'] = gir_crop_row['villcdname']
                                insertObj['crop_name'] = gir_crop_row['crop_name_hi']
                                insertObj['village_id'] = gir_crop_row['VillageID']
                                insertObj['crop_year'] = "2023-2024"
                                insertObj['crop_season'] = 2
                                insertObj['girdawari_status'] = 'N'
                                insertObj['status'] = 'OC'
                                insertObj['type'] = village_type
                                obj["old_crop"].push({ ...insertObj });
                                cb1();
                            }, function (err, res) {
                                return cback2(err)
                            })
                        }
                    })

                }
            ], function (err, res) {
                obj["crop_length"] = obj["old_crop"].length > obj["new_crop"].length ? obj["old_crop"].length : obj["new_crop"].length;
                obj["is_new_girdawari"] = obj["new_crop"].length > 0 ? 'Y' : 'N';
                resToSend.push(obj);
                return cb(err, res)
            })
        }, function (err, result) {
            if (err) {
                return callback(err)
            }
            else {
                return callback(null, resToSend);
            }
        })
    },
    getCropDetailsFromLandWithGirdawari: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.land_details)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let arrayOfLand = params['land_details'];
        let insertObj = {}, resToSend = [];
        async.eachSeries(arrayOfLand, function (land, cb) {
            let village_code = land['VillageCensus'] ?? land['village_code'];
            let khasra_no = land['Khasra_No'] ?? land['khasra_no'];
            let village_type = land['type']
            let obj = land;
            obj["new_crop"] = [];
            obj["old_crop"] = [];
            obj["gir_crop"] = [];
            async.parallel([
                //get girdawari
                function (cback1) {
                    bhuiyanService.getGirdawariDataForLand(dbkey, request, { village_code, khasra_no }, sessionDetails, function (err, res) {
                        if (err) {
                            return cback1(1)
                        }
                        async.eachSeries(res, function (gir_crop_row, cb1) {
                            if (gir_crop_row['SubCropCode'] == 0) {
                                return cb1()
                            } else {
                                insertObj = {}
                                insertObj['village_code'] = +gir_crop_row['VillageCensus']
                                insertObj['khasra_no'] = gir_crop_row['Khasra_No']
                                insertObj['crop_code'] = +gir_crop_row['SubCropCode']
                                insertObj['crop_area'] = +(+gir_crop_row['SubCropArea']).toFixed(4);
                                insertObj['crop_name'] = gir_crop_row['SubCropName']
                                insertObj['village_name'] = gir_crop_row['VillageName']
                                insertObj['village_id'] = +gir_crop_row['VillageID']
                                insertObj['crop_year'] = gir_crop_row['CropYear']
                                insertObj['crop_season'] = gir_crop_row['CropSeason']
                                insertObj['girdawari_status'] = 'Y'
                                insertObj['status'] = 'OC';
                                insertObj['type'] = village_type
                                obj["gir_crop"].push({ ...insertObj });
                                cb1();
                            }
                        }, function (err, res) {
                            return cback1(err)
                        })
                    })
                },
                // get old girdawari
                function (cback2) {
                    let qAndP = FARMER_QUERIES.getOldGirdawariQueryParamObj(village_code, khasra_no)
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                        if (err) {
                            return cback2(err)
                        } else {
                            async.eachSeries(res.data, function (gir_crop_row, cb1) {
                                insertObj = {}
                                insertObj['village_code'] = gir_crop_row['VillageLGCode']
                                insertObj['khasra_no'] = gir_crop_row['KhasraNo']
                                insertObj['crop_code'] = gir_crop_row['SubCropCode']
                                insertObj['crop_area'] = gir_crop_row['CropArea']
                                insertObj['village_name'] = gir_crop_row['villcdname']
                                insertObj['crop_name'] = gir_crop_row['crop_name_hi']
                                insertObj['village_id'] = gir_crop_row['VillageID']
                                insertObj['crop_year'] = "2023-2024"
                                insertObj['crop_season'] = 2
                                insertObj['girdawari_status'] = 'N'
                                insertObj['status'] = 'OC'
                                insertObj['type'] = village_type
                                obj["old_crop"].push({ ...insertObj });
                                cb1();
                            }, function (err, res) {
                                return cback2(err)
                            })
                        }
                    })

                },
                // get entry crop detaills
                function (cback2) {
                    let qAndP = FARMER_QUERIES.getFarmerRgCropDetailsByVillageKhasraQueryParamObj(village_code, khasra_no);
                    let is_pc = false
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                        if (err) {
                            return cback2(err)
                        } else {
                            async.eachSeries(res.data, function (gir_crop_row, cb1) {
                                insertObj = {}
                                insertObj['village_code'] = gir_crop_row['village_code']
                                insertObj['khasra_no'] = gir_crop_row['khasra_no']
                                insertObj['crop_code'] = gir_crop_row['crop_code']
                                insertObj['crop_area'] = gir_crop_row['crop_area']
                                insertObj['village_name'] = gir_crop_row['villcdname']
                                insertObj['crop_name'] = gir_crop_row['crop_name_hi']
                                insertObj['village_id'] = gir_crop_row['VillageID']
                                insertObj['crop_year'] = "2024-2025"
                                insertObj['crop_season'] = 2
                                insertObj['girdawari_status'] = gir_crop_row['girdawari_status']
                                insertObj['status'] = gir_crop_row['status']
                                insertObj['type'] = village_type
                                obj["gir_crop"].forEach((element) => {
                                    if (gir_crop_row.crop_code == element.crop_code && gir_crop_row.crop_area == element.ccrop_area) {
                                        insertObj['girdawari_status'] = 'Y'
                                    }
                                });
                                obj["new_crop"].push({ ...insertObj });
                                obj['is_pc'] = false
                                if (!is_pc && gir_crop_row['status'] == 'PC') {
                                    is_pc = true
                                    obj['is_pc'] = true
                                }
                                cb1();
                            }, function (err, res) {
                                return cback2(err)
                            })
                        }
                    })

                }
            ], function (err, res) {
                obj["crop_length"] = obj["gir_crop"].length > obj["new_crop"].length ? obj["gir_crop"].length : obj["new_crop"].length;
                obj["is_new_girdawari"] = obj["gir_crop"].length > 0 ? 'Y' : 'N';
                obj["row_status"] = 'A';
                resToSend.push(obj);
                cb(err, res)
            })
        }, function (err, result) {
            if (err) {
                return callback(err)
            }
            else {
                return callback(null, resToSend);
            }
        })
    },
    checkLandIsAvailable: function (dbkey, request, params, sessionDetails, callback) {
        if (!params.landArray) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let fs_id = +params["fs_id"] ?? -1;
        let resToSend = [];
        let village_code, khasra_no = '', ID_MasterKey_Khasra, qAndpObj;
        async.eachSeries(params['landArray'], function (land, cb) {
            let obj = { ...land };
            async.series([
                function (cback1) {
                    village_code = +(land["VillageCensus"] ?? land['village_code']);
                    khasra_no = (land["Khasra_No"] ?? land["khasra_no"]).toString();
                    ID_MasterKey_Khasra = land['ID_MasterKey_Khasra'] ?? land['id_masterkey_khasra']
                    return cback1();
                },
                // check in new database 
                function (cback3) {
                    qAndpObj = FARMER_QUERIES.checkVillageKhasra_New_QueryParamObj(village_code, khasra_no, fs_id, ID_MasterKey_Khasra);
                    DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getWorkingDBDetails(), qAndpObj.query, qAndpObj.params, function (e1, r1) {
                        if (e1) {
                            return cback3(e1)
                        }
                        else if (r1 && r1.data && r1.data.length > 0) {
                            obj["is_available"] = 1;
                            obj["available_details"] = r1.data[0];
                            return cback3()
                        }
                        else {
                            obj["is_available"] = 0;
                            obj["available_details"] = []
                            return cback3()
                        }
                    })
                },
                // check in base database
                function (cback2) {
                    if (obj["is_available"] == 0) {
                        qAndpObj = FARMER_QUERIES.checkVillageKhasra_Base_QueryParamObj(village_code, khasra_no, fs_id);
                        DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getWorkingBaseDBDetails(), qAndpObj.query, qAndpObj.params, function (e1, r1) {
                            if (e1) {
                                return cback2(e1)
                            }
                            else if (r1 && r1.data && r1.data.length > 0) {
                                obj["is_available"] = 1;
                                obj["available_details"] = r1.data[0];
                                return cback2()
                            }
                            else {
                                obj["is_available"] = 0;
                                obj["available_details"] = []
                                return cback2()
                            }
                        })
                    }
                    else {
                        return cback2()
                    }
                }

            ], function (err, res) {
                if (err) {
                    return cb(err)
                }
                else {
                    resToSend.push(obj);
                    return cb()
                }
            })
        }, function (err, result) {
            if (err) {
                return callback(err)
            }
            else {
                return callback(null, resToSend);
            }
        })
    },
    checkAadharExistForSocietyInFarmerRepresentative: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.aadharNo && params.society_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        if (params.aadharNo.toString().length != 12) return callback(securityService.SECURITY_ERRORS.INVALID_AADHAR_NO);
        let aadharNo = +params["aadharNo"];
        let society = +params["society_id"];
        let qAndParam = {}, max_flag = false, aadharRef = '', result = {};
        async.series([
            //get Ref of Aadhar
            function (cback1) {
                try {
                    let options = { url: aadharToARefUrl, json: true, body: { "aadharNo": aadharNo } };
                    req.post(options, function (error, response, body) {
                        result = body;
                        if (error) {
                            return cback1(error);
                        }
                        else if (body && body.err) {
                            return cback1(result.err);
                        }
                        else {
                            aadharRef = result.data;
                            return cback1();
                        }
                    })
                } catch (e) {
                    return cback1(e);
                }
            },
            function (cback2) {
                qAndParam = FARMER_QUERIES.checkAadharExistForSocietyInFarmerRepresentativeQPObj(aadharRef, society)
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback2(e1);
                    }
                    else if (r1 && r1.data && r1.data.length == 1) {
                        max_flag = r1.data[0]["count"] >= max_nominee_count;
                        return cback2(null);
                    }
                    else {
                        return cback2({ "message": `Err` });
                    }
                });
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, { max_flag, "aadharNo": aadharNo, "aadharRef": aadharRef });
            }
        })
    },
    getForestCrop: function (dbkey, data1, params, sessionDetails, callback) {
        if (!(params.forest_land && params.fs_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let land = params["forest_land"];
        let fs_id = +params["fs_id"];
        let crop = [];
        async.eachSeries(land, function (l, cb1) {
            let qAndP = {}, obj = {};
            obj = l;
            let { village_code, khasra_no } = l;
            obj["old_crop"] = [];
            obj["new_crop"] = [];
            obj["gir_crop"] = [];
            obj["row_status"] = "A";
            async.series([
                function (cback1) {
                    is_pc = false
                    qAndP = FARMER_QUERIES.getForestCrop_New_QueryParamObj(village_code, khasra_no, fs_id);
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                        if (e1) {
                            return cback1(e1);
                        }
                        else {
                            async.eachSeries(r1.data, function (gir_crop_row, cb1) {
                                obj['is_pc'] = false
                                if (!is_pc && gir_crop_row['status'] == 'PC') {
                                    is_pc = true
                                    obj['is_pc'] = true
                                }
                                cb1();
                            }, function (err, res) {
                                obj["new_crop"].push(...r1.data);
                                return cback1(null);
                            })
                        }
                    })

                },
                function (cback2) {
                    let qAndP = FARMER_QUERIES.getForestCrop_Base_QueryParamObj(village_code, khasra_no, fs_id)
                    DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getWorkingBaseDBDetails(), qAndP.query, qAndP.params, function (e1, r1) {
                        if (e1) {
                            return cback2(e1);
                        }
                        else {
                            obj["old_crop"].push(...r1.data);
                            return cback2(null);
                        }
                    })

                },

            ], function (e, r) {
                if (e) {
                    return cb1(e);
                }
                else {
                    crop.push(obj);
                    return cb1();
                }
            });
        },
            function (err, res) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, crop);
                }
            })
    },
    getFarmerDetailsForPavtiByFsId: function (dbkey, request, params, sessionDetails, callback) {
        // dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails()
        if (!(params.fs_id)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: 'fs_id is required.' })
        let fs_id = +params["fs_id"];
        let qAndP = {}, resToSend = {};
        resToSend["landDetails"] = [];
        resToSend["landWithCropDetails"] = [];
        resToSend["registration"] = [];
        async.series([
            function (cback1) {
                qAndP = FARMER_QUERIES.getFarmerBasicDetailForReciptQueryParamObj(fs_id);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err41, res41) {
                    if (err41) {
                        return cback1(err41);
                    }
                    else {
                        const basic_data = res41.data
                        if (basic_data.length > 0) {
                            basic_data[0]['dob'] = format(basic_data[0]['dob'], 'dd-MM-yyyy');
                            basic_data[0]['dtstamp'] = format(basic_data[0]['dtstamp'], 'dd-MM-yyyy hh:mm a');
                            basic_data[0]['registration_type'] = basic_data[0].entry_type_code == 1 && basic_data[0].is_update == null ? 'कैरी फॉरवर्ड' : basic_data[0].entry_type_code == 2 && basic_data[0].is_update == null ? "नवीन पंजीयन" : "संशोधन";
                        }
                        resToSend["basicDetails"] = basic_data;
                        return cback1(null);
                    }
                })
            },
            function (cback2) {
                if (resToSend["basicDetails"].length > 0) {
                    qAndP = FARMER_QUERIES.getFarmerLandDetailsForRecieptQueryParamObj(fs_id);
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err41, res41) {
                        if (err41) {
                            return cback2(err41);
                        }
                        else {
                            resToSend["landDetails"] = res41.data;
                            return cback2(null);
                        }
                    })
                } else {
                    return cback2();
                }
            },
            function (cback3) {
                if (resToSend["basicDetails"].length > 0) {
                    let obj = {};
                    async.eachSeries(resToSend["landDetails"], function (land, cb1) {
                        obj = { ...land };
                        qAndP = FARMER_QUERIES.getFarmerCropByVillageCodeAndKhasraForReciept(fs_id, land["village_code"],
                            land["khasra_no"], +land["land_table"]);
                        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
                            if (e) {
                                return cb1(e);
                            }
                            else {
                                obj["new_crop"] = r.data;
                                resToSend["landWithCropDetails"].push(obj);
                                return cb1(null);
                            }
                        })
                    }, function (err, res) {
                        if (err) {
                            return cback3(err);
                        }
                        else {
                            return cback3()
                        }
                    })
                }
                else {
                    return cback3()
                }
            },
            function (cback4) {
                qAndP = FARMER_QUERIES.getFarmerRegistrationLandAndCropQuery(fs_id);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err51, res51) {
                    if (err51) {
                        return cback4(err51);
                    }
                    else {
                        const registration = {
                            rg_land: '0.0000',
                            rg_crop: '0.0000',
                            rg_paddy: '0.0000',
                            vp_land: '0.0000',
                            vp_crop: '0.0000',
                            vp_paddy: '0.0000',
                            us_land: '0.0000',
                            us_crop: '0.0000',
                            us_paddy: '0.0000',
                            vg_land: '0.0000',
                            vg_crop: '0.0000',
                            vg_paddy: '0.0000',
                        }
                        res51.data.forEach(res => {
                            if (res.land_type_code === 1) {
                                registration['rg_land'] = res.land_area.toFixed(4);
                                registration['rg_crop'] = res.crop_area.toFixed(4);
                                registration['rg_paddy'] = res.paddy_area.toFixed(4);
                            }
                            if (res.land_type_code === 2) {
                                registration['vp_land'] = res.land_area.toFixed(4);
                                registration['vp_crop'] = res.crop_area.toFixed(4);
                                registration['vp_paddy'] = res.paddy_area.toFixed(4);
                            }
                            if (res.land_type_code === 3) {
                                registration['vg_land'] = res.land_area.toFixed(4);
                                registration['vg_crop'] = res.crop_area.toFixed(4);
                                registration['vg_paddy'] = res.paddy_area.toFixed(4);
                            }
                            if (res.land_type_code === 4) {
                                registration['us_land'] = res.land_area.toFixed(4);
                                registration['us_crop'] = res.crop_area.toFixed(4);
                                registration['us_paddy'] = res.paddy_area.toFixed(4);
                            }
                        })

                        resToSend["registration"] = registration;
                        return cback4(null);
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, resToSend);
            }
        });
    },
    getFarmerDetailsForVarisanByFsid: function (dbkey, request, params, sessionDetails, callback) {
        let fs_id = +params["fs_id"];
        let qAndP = {}, resToSend = {};
        resToSend["landDetails"] = [];
        resToSend["landWithCropDetails"] = [];
        async.series([
            function (cback1) {
                qAndP = FARMER_QUERIES.getFarmerBasicDetailsForVarisanQueryParam(fs_id);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err41, res41) {
                    if (err41) {
                        return cback1(err41);
                    }
                    else {
                        resToSend["basicDetails"] = res41.data;
                        return cback1(null);
                    }
                })
            },
            function (cback2) {
                if (resToSend["basicDetails"].length > 0) {
                    qAndP = FARMER_QUERIES.getFarmerAllLandDetails(fs_id);
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err41, res41) {
                        if (err41) {
                            return cback2(err41);
                        }
                        else {
                            resToSend["landDetails"] = res41.data;
                            return cback2(null);
                        }
                    })
                } else {
                    return cback2();
                }
            },
            function (cback3) {
                if (resToSend["basicDetails"].length > 0) {
                    let obj = {};
                    async.eachSeries(resToSend["landDetails"], function (land, cb1) {
                        obj = { ...land };
                        qAndP = FARMER_QUERIES.getFarmerCropByVillageCodeAndKhasraForVarisan(fs_id, land["village_code"],
                            land["khasra_no"], land["land_table"]);
                        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
                            if (e) {
                                return cb1(e);
                            }
                            else {
                                obj["new_crop"] = r.data;
                                resToSend["landWithCropDetails"].push(obj);
                                return cb1(null);
                            }
                        })

                    }, function (err, res) {
                        if (err) {
                            return cback3(err);
                        }
                        else {
                            return cback3()
                        }
                    })
                }
                else {
                    return cback3()
                }
            },
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, resToSend);
            }
        });
    },
    getFarmerDetails: function (dbkey, request, params, sessionDetails, callback) {
        let fs_id = +params["fs_id"];
        let type = params['type'] ?? 3;
        let search = params['search'] ?? fs_id
        let search2 = params['search2'] ?? null
        let qAndParam = {};
        let uf_id = 0, basic_details = [], land_details = [], vp_land = [];

        async.series([
            function (cback1) {
                qAndParam = FARMER_QUERIES.getFarmerBasicDetailQueryParamObj(type, search, search2);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else if (r1 && r1.data && r1.data.length > 0) {
                        uf_id = +r1.data[0]["uf_id"];
                        fs_id = +r1.data[0]["fs_id"];
                        basic_details = r1.data;
                        return cback1(null, r1.data[0]);
                    }
                    else {
                        basic_details = r1.data;
                        return cback1(null, r1.data);
                    }
                })
            },
            function (cback4) {
                if (basic_details.length > 0) {
                    qAndParam = FARMER_QUERIES.getFarmerAllLandDetails(fs_id);
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                        if (e1) {
                            return cback4(e1);
                        }
                        else if (r1 && r1.data) {
                            return cback4(null, r1.data);
                        }
                    })
                }
                else {
                    return cback4();
                }
            },
            // function (cback2) {
            //     if (basic_details.length > 0) {
            //         qAndParam = FARMER_QUERIES.getFarmerForestLandQueryParamObj(type, search);
            //         DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
            //             if (e1) {
            //                 return cback2(e1);
            //             }
            //             else if (r1 && r1.data) {
            //                 //added for vp land to send in bhuiyan
            //                 vp_land = r1.data.filter(function (e) {
            //                     return e.type == 'VP'
            //                 })
            //                 land_details = land_details.concat(vp_land);
            //                 let vg_us_land = r1.data.filter(function (e) {
            //                     return e.type != 'VP'
            //                 })
            //                 return cback2(null, vg_us_land);
            //             }
            //         })
            //     }
            //     else {
            //         return cback2();
            //     }
            // },
            function (cback3) {
                if (basic_details.length > 0) {
                    qAndParam = FARMER_QUERIES.getFarmerForestCropQueryParamObj(type, search, search2);
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                        if (e1) {
                            return cback3(e1);
                        }
                        else if (r1 && r1.data) {
                            return cback3(null, r1.data);
                        }
                    })
                }
                else {
                    return cback3();
                }
            },

        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                if (basic_details.length == 0) {
                    return callback(null, { "code": "DATA_NOT_FOUND" })
                }
                else {
                    return callback(null, {
                        "basic_details": res[0],
                        "all_land_details": res[1],
                        "crop_details_forest": res[2],
                        "code": "SUCCESS"
                    });
                }
            }
        })
    },
    getFarmerBasicDetails: function (dbkey, request, params, sessionDetails, callback) {
        let fs_id = +params["fs_id"];
        let type = params['type'] ?? 3;
        let search = params['search'] ?? fs_id
        let search2 = params['search2'] ?? null
        let qAndParam = FARMER_QUERIES.getFarmerBasicDetailQueryParamObj(type, search, search2);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else if (r1 && r1.data && r1.data.length > 0) {
                return callback(null, r1.data);
            }
            else {

                return callback({ message: 'no basic data found' });
            }
        })
    },
    getFarmerLandDetailsWithBhuyianCheck: function (dbkey, request, params, sessionDetails, callback) {
        let qAndParam = {}, land_data = [], land_data_bhuyian = [], one_land = [], fs_id = params['fs_id'], insert_obj = {};
        let type = params['type'] ?? 3;
        let search = params['search'] ?? fs_id
        async.series([
            function (cback1) {
                qAndParam = FARMER_QUERIES.getFarmerRgLandQueryParamObj(type, search);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else if (r1 && r1.data) {
                        land_data = r1.data;
                        return cback1(null);
                    }
                })
            },
            function (cback2) {
                async.eachSeries(land_data, function (land, cb1) {
                    async.series([
                        function (c0) {
                            one_land = land_data_bhuyian.filter(function (l) {
                                return +l["VillageCensus"] == land["village_code"] && l["Khasra_No"] == land["khasra_no"];
                            })
                            return c0();
                        },
                        function (c1) {
                            if (one_land.length == 0) {
                                bhuiyanService.getBhuiyanDataForLandWithCheck(dbkey, request, land, sessionDetails, function (err, res) {
                                    //console.log('err------------->', err, land)
                                    if (err) {
                                        if (err.status == 0) {
                                            insert_obj['VillageCensus'] = land["village_code"];
                                            insert_obj['Khasra_No'] = land["khasra_no"];
                                            insert_obj['FarmSize'] = land['land_area'];
                                            insert_obj['OwnerName'] = land['OwnerName'];
                                            insert_obj['OwnerType'] = land['owner_type_name'];
                                            insert_obj['Reason'] = 'भूईआं से अमान्य';
                                            insert_obj['VillageID'] = land['village_id'];
                                            insert_obj['VillageName'] = land['villcdname']
                                            insert_obj["invalid"] = 1;
                                            insert_obj["is_available"] = 0;
                                            land_data_bhuyian.push({ ...insert_obj });
                                            return c1();
                                        }
                                        else {
                                            return c1(err);
                                        }
                                    }
                                    else {
                                        land_data_bhuyian.push(...res);
                                        return c1();
                                    }
                                })
                            }
                            else {
                                return c1();
                            }
                        },
                        // add extraa value in bhuyian data for varis land
                        function (c2) {
                            let index = land_data_bhuyian.findIndex(function (l) { return l["VillageCensus"] == land["village_code"] && l["Khasra_No"] == land["khasra_no"] })
                            if (index != -1) {
                                land_data_bhuyian[index]['flag_varis_land'] = land['flag_varis_land']
                                land_data_bhuyian[index]['is_available'] = 0
                            }
                            return c2()
                        }
                    ], function (err, res) {
                        if (err) {
                            return cb1(err)
                        }
                        else {
                            return cb1();
                        }
                    })
                },
                    function (err, res) {
                        if (err) {
                            return cback2(err)
                        }
                        else {
                            return cback2();
                        }
                    })
            }
        ],
            function (err1, res1) {
                if (err1) {
                    return callback(err1);
                }
                else {
                    return callback(null, land_data_bhuyian);
                }
            })
    },
    getAllDetailsOfLand: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.village_code && params.khasra_no)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let village_code = params['village_code']
        let khasra_no = params['khasra_no'];
        let khasra_arr = []
        let sendObj = {};
        async.series([
            function (cback1) {
                bhuiyanService.getBhuiyanDataForLand(dbkey, request, { village_code, khasra_no }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback1(err)
                    } else {
                        sendObj.land_arr = res;
                        res.forEach(e => {
                            khasra_arr.push(`"${e.Khasra_No}"`)
                        })
                        return cback1();
                    }
                })
            },
            function (cback2) {
                async.parallel([
                    function (cback21) {
                        let p = { village_code, khasra_arr: khasra_arr.toString() };
                        farmer.getLandData_New(dbkey, request, p, sessionDetails, (err, res) => {
                            if (err) {
                                return cback21(err)
                            } else {
                                sendObj['new_land'] = res.data
                                return cback21()
                            }
                        })
                    },
                    function (cback22) {
                        let p = { village_code, khasra_arr: khasra_arr.toString() };
                        farmer.getLandData_Base(CONFIG_PARAMS.getWorkingBaseDBDetails(), request, p, sessionDetails, (err, res) => {
                            if (err) {
                                return cback22(err)
                            } else {
                                //console.log(res.data);
                                sendObj['old_land'] = res.data
                                return cback22()
                            }
                        })
                    },
                    function (cback23) {
                        let p = { 'land_details': sendObj.land_arr, village_code, khasra_arr }
                        farmer.getCropDetails(dbkey, request, p, sessionDetails, (err, res) => {
                            if (err) {
                                return cback23(err)
                            } else {
                                sendObj = { ...sendObj, ...res }
                                return cback23()
                            }
                        })
                    }
                ], function (err, res) {
                    return cback2(err, res)
                })
            }
        ], function (err, res) {
            //console.log(err, sendObj);
            sendObj.khasra = khasra_arr
            return callback(err, sendObj)
        })

    },
    getLandData_New: function (dbkey, request, params, sessionDetails, callback) {
        let qAndP = FARMER_QUERIES.getLandData_New_QueryParamObj(params.village_code, params.khasra_arr);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
            return callback(err, res)
        });
    },
    getLandData_Base: function (dbkey, request, params, sessionDetails, callback) {
        let qAndP = FARMER_QUERIES.getLandData_Base_QueryParamObj(params.village_code, params.khasra_arr);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, (err, res) => {
            return callback(err, res)
        });
    },
    getCropDetails: function (dbkey, request, params, sessionDetails, callback) {
        let arrayOfLand = params['land_details'];
        let { village_code, khasra_arr } = params;
        let sendObj = { new_gir_crop: [], old_gir_crop: [], new_crop: [], old_crop: [] };
        async.parallel([
            function (cback1) {
                farmer.getBothGirdawariDataForLand(dbkey, request, { land_details: arrayOfLand }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback1(err)
                    } else {
                        // console.log('girdawari_crop',res);
                        res.forEach(e => {
                            console.log(e['new_crop']);
                            if (e['new_crop'].length > 0) {
                                e['new_crop'].forEach(e1 => {
                                    sendObj['new_gir_crop'].push(e1)
                                })
                            }
                            if (e['old_crop'].length > 0) {
                                e['old_crop'].forEach(e1 => {
                                    sendObj['old_gir_crop'].push(e1)
                                })
                            }
                        })
                        return cback1();
                    }
                })
            },
            function (cback2) {
                let p = { village_code, khasra_arr: khasra_arr.toString() };
                farmer.getCropData_New(dbkey, request, p, sessionDetails, (err, res) => {
                    if (err) {
                        return cback2(err)
                    } else {
                        sendObj['new_crop'] = res.data
                        return cback2()
                    }
                })
            },
            function (cback3) {
                let p = { village_code, khasra_arr: khasra_arr.toString() };
                farmer.getCropData_Base(CONFIG_PARAMS.getWorkingBaseDBDetails(), request, p, sessionDetails, (err, res) => {
                    if (err) {
                        return cback3(err)
                    } else {
                        sendObj['old_crop'] = res.data
                        return cback3()
                    }
                })
            }
        ], function (err, res) {
            // console.log('crop', sendObj);
            callback(err, sendObj)
        })

    },
    getCropData_Base: function (dbkey, request, params, sessionDetails, callback) {
        let qAndP = FARMER_QUERIES.getCropData_Base_QueryParamObj(params.village_code, params.khasra_arr);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
            return callback(err, res)
        });
    },
    getCropData_New: function (dbkey, request, params, sessionDetails, callback) {
        let qAndP = FARMER_QUERIES.getCropData_New_QueryParamObj(params.village_code, params.khasra_arr);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
            return callback(err, res)
        });
    },
    getFarmerDetailsForRejectionByFsid: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.isNewFarmer && (params.isNewFarmer == 'N' || params.isNewFarmer == 'Y'))) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: 'fs_id is required.' })
        let fs_id = +params["fs_id"];
        let isNewFarmer = params["isNewFarmer"];
        let qAndP = {}, resToSend = {};
        resToSend["landDetails"] = [];
        resToSend["landWithCropDetails"] = [];
        if (isNewFarmer == "Y") {
            dbkey = CONFIG_PARAMS.getWorkingDBDetails();
        }
        else {
            dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails();
        }

        async.series([
            function (cback1) {
                qAndP = FARMER_QUERIES.getFarmerBasicDetailsForRejectionFarmerQueryParam(fs_id, isNewFarmer);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err41, res41) {
                    if (err41) {
                        return cback1(err41);
                    }
                    else {
                        resToSend["basicDetails"] = res41.data;
                        return cback1(null);
                    }
                })
            },
            function (cback2) {
                if (resToSend["basicDetails"].length > 0) {
                    qAndP = FARMER_QUERIES.getFarmerLandDetailsForRecieptQueryParamObj(fs_id);
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err41, res41) {
                        if (err41) {
                            return cback2(err41);
                        }
                        else {
                            resToSend["landDetails"] = res41.data;
                            return cback2(null);
                        }
                    })
                } else {
                    return cback2();
                }
            },
            function (cback3) {
                if (resToSend["basicDetails"].length > 0) {
                    let obj = {};
                    async.eachSeries(resToSend["landDetails"], function (land, cb1) {
                        obj = { ...land };
                        qAndP = FARMER_QUERIES.getFarmerCropByVillageCodeAndKhasraForReciept(fs_id, +land["village_code"],
                            land["khasra_no"], +land["land_table"]);
                        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
                            if (e) {
                                return cb1(e);
                            }
                            else {
                                obj["new_crop"] = r.data;
                                resToSend["landWithCropDetails"].push(obj);
                                return cb1(null);
                            }
                        })
                    }, function (err, res) {
                        if (err) {
                            return cback3(err);
                        }
                        else {
                            return cback3()
                        }
                    })
                }
                else {
                    return cback3();
                }
            },
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, resToSend);
            }
        });
    },
    getFarmerDetailsByFsidForSanshodhan: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.type && (params.type == 1 || params.type == 2 || params.type == 3))) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: 'fs_id is required.' })
        const { fs_id, type } = params;
        let qAndP;

        if (type == 1) {
            qAndP = FARMER_QUERIES.getAadharDetailsForSanshodhanByFsidQandP(fs_id);
        }
        else if (type == 2 || type == 3) {
            qAndP = FARMER_QUERIES.getBasicDetailsForSanshodhanByFsidQandP(fs_id, type);
        }

        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, (err, res) => {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, res.data);
            }
        });
    },
    getTrustBasicDetails_Base: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.farmer_code)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails()
        let farmer_code = params["farmer_code"];
        let qAndParam = {};
        let basic_details = [];

        async.series([
            function (cback1) {
                qAndParam = FARMER_QUERIES.getTrustBasicDetail_Base_QueryParamObj(farmer_code);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else if (r1 && r1.data && r1.data.length == 1) {
                        basic_details = r1.data;
                        return cback1(null, r1.data[0]);
                    }
                    else {
                        return cback1(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
                    }
                })
            },
            function (cback2) {
                qAndParam = FARMER_QUERIES.getTrustLandDetails_Base_QueryParamObj(farmer_code);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback2(e1);
                    }
                    else {
                        return cback2(null, r1.data);
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, {
                    "basic_details": res[0],
                    "land_details": res[1],
                });
            }
        })
    },
    getFarmerBasicDetails_Base_AadharNull: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.farmer_code)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails()
        let farmer_code = params["farmer_code"];
        let qAndParam = FARMER_QUERIES.getFarmerBasicDetails_Base_AadharNullQPObj(farmer_code);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else if (r1 && r1.data && r1.data.length == 1) {
                return callback(null, r1.data[0]);
            }
            else {
                return callback(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
            }
        })
    }
}

module.exports = farmer;
