let req = require('request');
let format = require('date-format');
let async = require('async');
let config = require('config');
const userValidations = require('../validators/uservalidator.js');
const apiURLAddFarmerDetail = config.get('apiURLAddFarmerDetail');//
const apiURLSansodhanFarmerDetail = config.get('apiURLSansodhanFarmerDetail');//
const apiURlUpdateFarmerRepresentative = config.get('apiURlUpdateFarmerRepresentative');//
const apiURLCarryForwardFarmerDetail = config.get('apiURLCarryForwardFarmerDetail');
const apiURLInsertNewVarsionFarmer = config.get('apiURLInsertNewVarsionFarmer');
const apiURLUpdateVarisonFarmeronExistingSociety = config.get('apiURLUpdateVarisonFarmeronExistingSociety');
const farmerDeleteFoodApi = config.get('farmerDeleteFoodApi');
const { getLastFourDigits } = require('./commonService.js')


let food_s = {
    //new farmer
    foodApiAddKisan: function (dbkey, data1, params, sessionDetails, callback) {
        if (!(params && data1.uf_id && data1.fs_id)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        let { uf_id, fs_id, rg_land_details, paddy_maize_rg_Crop, paddy_forest_crop_details, currentDateTime } = food_s.convertObjectForFood(data1, params)
        let FarmerRepresentativeList = [], food_response;
        //console.log(rg_land_details);
        let total_forest_paddy_rkba = +(paddy_forest_crop_details.reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)),
            totalRakba = +(rg_land_details.reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + +total_forest_paddy_rkba,
            rakbaOfPaddy = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + total_forest_paddy_rkba,
            maizeRakba = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 103 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)),
            ip_address = sessionDetails['ip_address'];
        let sendObj = {}, sendArray = [];
        //return 
        async.series([
            // make main array for send into food api 
            function (cback3) {
                let data = params["basic_details"];
                let { farmer_name_aadhar, farmer_name_hi, relation, father_name, caste_code, subcaste_code,
                    gender, address, aadhar_number, mobile_no, dob } = data["mas_farmer"];
                let { society_id, account_no, bank_code, branch_code, ifsc_code, village_code } = data["farmer_society"];
                let { Name, Relation, TypeofPerson, AadharNo, UserID } = data["farmer_representative"];
                let g = gender == 'M' ? 'पुरुष' : 'महिला';
                sendObj["District"] = sessionDetails['district_id'].toString();
                sendObj["Society"] = society_id.toString();
                sendObj["FarmerName"] = farmer_name_hi;
                sendObj["FarmerCode"] = uf_id;
                sendObj["Sex"] = g;
                sendObj["Father_HusbandName"] = father_name;
                sendObj["Relation"] = relation == 'F' ? 'पिता' : 'पति';
                sendObj["Caste"] = caste_code.toString();
                sendObj["SubCaste"] = subcaste_code.toString();
                sendObj["Address"] = address;
                sendObj["TotalRakba"] = totalRakba.toFixed(4);
                sendObj["RakbaOfPaddy"] = rakbaOfPaddy.toFixed(4);
                sendObj["MaizeRakba"] = maizeRakba.toFixed(4);
                sendObj["AccountNo"] = account_no;
                sendObj["BankName"] = bank_code.toString();
                sendObj["BranchName"] = branch_code.toString();
                sendObj["IFSCCode"] = ifsc_code.toString();
                sendObj["RationCardNo"] = "NA";
                sendObj["AadharNo"] = aadhar_number.toString();
                sendObj["AadharName"] = farmer_name_aadhar;
                sendObj["MobileNo"] = mobile_no.toString();
                sendObj["NewVLocationCode"] = village_code.toString();
                sendObj["IPAddress"] = ip_address;
                sendObj["DateTimeStamp"] = currentDateTime;
                sendObj["DateofPanjiyan"] = currentDateTime;
                sendObj["SocietyMemberShipNo"] = "NA";
                sendObj["LastFourDigit"] = getLastFourDigits(aadhar_number);
                sendObj["fs_id"] = fs_id;
                sendObj['DOB'] = dob

                FarmerRepresentativeList.push({
                    "FarmerCode": uf_id, "TypeofPerson": TypeofPerson, "Name": Name, "Relation": Relation, "AadharNo": AadharNo, "FourDigit": getLastFourDigits(AadharNo), "IPAddress": ip_address,
                    "UserID": UserID.toString(), "Opration": "Insert", "EntryDateTime": currentDateTime, "LastUpdateDate": currentDateTime
                })
                sendObj["FarmerRegKhasraDetailsList"] = food_s.convertLandForFood({ uf_id, fs_id, currentDateTime }, rg_land_details, params['crop_details']);
                sendObj["FarmerAreaUsageDetailsList"] = food_s.convertRgCropForFood({ uf_id, fs_id, currentDateTime }, paddy_maize_rg_Crop);
                sendObj["FarmerVanGramPaataNoList"] = food_s.convertForestCropForFood({ uf_id, fs_id, currentDateTime }, paddy_forest_crop_details);
                sendObj["FarmerRepresentativeList"] = FarmerRepresentativeList;
                sendArray.push(sendObj);
                return cback3()
            },
            //check validation and call food api
            function (cback31) {
                const { error, value } = userValidations.FoodNewFarmerObjectValidation(sendArray, data1['entry_type']);
                if (error && error.details) {
                    return cback31(error.details[0].message);

                } else {
                    // console.log('food api value', value);
                    food_s.ApiCall(apiURLAddFarmerDetail, sendArray, function (err, res) {
                        if (err) {
                            return cback31(err)
                        } else {
                            food_response = res
                            return cback31(null, res)
                        }
                    })

                }
            }
        ],
            function (err, res) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, food_response);
                }
            })
    },
    // carry forward farmer
    carryForwardFoodApi: function (dbkey, data1, params, sessionDetails, callback) {
        if (!(params && data1.uf_id && data1.fs_id)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        let { uf_id, fs_id, rg_land_details, paddy_maize_rg_Crop, paddy_forest_crop_details, currentDateTime } = food_s.convertObjectForFood(data1, params)
        let FarmerRepresentativeList = [], food_response;
        let total_forest_paddy_rkba = +(paddy_forest_crop_details.reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)),
            totalRakba = +(rg_land_details.reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + total_forest_paddy_rkba,
            rakbaOfPaddy = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + total_forest_paddy_rkba,
            maizeRakba = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 103 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)),
            ip_address = sessionDetails['ip_address'];
        let sendObj = {}, sendArray = [];
        async.series([
            // make main array for send into food api 
            function (cback3) {
                let data = params["basic_details"];
                let { farmer_name_aadhar, farmer_name_hi, father_name, address, aadhar_number, mobile_no, dob } = data["mas_farmer"];
                let { account_no, bank_code, branch_code, ifsc_code, farmer_code } = data["farmer_society"];
                let { Name, Relation, TypeofPerson, AadharNo, UserID } = data["farmer_representative"];
                sendObj["FarmerName"] = farmer_name_hi;
                sendObj["FarmerCode"] = farmer_code;
                sendObj["Father_HusbandName"] = father_name;
                sendObj["Address"] = address;
                sendObj["AccountNo"] = account_no + '';
                sendObj["BankName"] = bank_code + '';
                sendObj["BranchName"] = branch_code + '';
                sendObj["IFSCCode"] = ifsc_code + '';
                sendObj["AadharNo"] = aadhar_number;
                sendObj["AadharName"] = farmer_name_aadhar + '';
                sendObj["MobileNo"] = mobile_no + '';
                sendObj['DOB'] = dob
                FarmerRepresentativeList.push({
                    "FarmerCode": uf_id, "TypeofPerson": TypeofPerson, "Name": Name, "Relation": Relation, "AadharNo": AadharNo + "", "FourDigit": getLastFourDigits(AadharNo), "IPAddress": ip_address,
                    "UserID": UserID + '', "Opration": "Insert", "EntryDateTime": currentDateTime, "LastUpdateDate": currentDateTime
                })
                sendObj["FarmerRegKhasraDetailsList"] = food_s.convertLandForFood({ uf_id, fs_id, currentDateTime }, rg_land_details, params['crop_details']);
                sendObj["FarmerAreaUsageDetailsList"] = food_s.convertRgCropForFood({ uf_id, fs_id, currentDateTime }, paddy_maize_rg_Crop);
                sendObj["FarmerVanGramPaataNoList"] = food_s.convertForestCropForFood({ uf_id, fs_id, currentDateTime }, paddy_forest_crop_details);
                sendObj["FarmerRepresentativeList"] = FarmerRepresentativeList;
                sendArray.push(sendObj);
                // console.log('sendobj-->', sendObj)
                return cback3()
            },
            //check validation and call food api
            function (cback4) {
                const { error, value } = userValidations.FoodCarryForwardFarmerObjectValidation(sendArray, data1['entry_type']);
                if (error && error.details) {
                    return cback4({ message: `in food api carryforward object :- ${error.details[0].message}`, errno: 1001, uf_id: uf_id });
                } else {
                    food_s.ApiCall(apiURLCarryForwardFarmerDetail, sendArray, function (err, res) {
                        if (err) {
                            return cback4(err)
                        } else {
                            food_response = res
                            return cback4(null, res)
                        }
                    })

                }
            }
        ],
            function (err, res) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, food_response);
                }
            })
    },
    // sansodhan farmer
    foodApiSansodhanKisan: function (dbkey, data1, params, sessionDetails, callback) {
        if (!(params && data1.uf_id && data1.fs_id && data1.farmer_code)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        let food_response;
        let { uf_id, fs_id, rg_land_details, paddy_maize_rg_Crop, paddy_forest_crop_details, currentDateTime } = food_s.convertObjectForFood(data1, params)
        let total_forest_paddy_rkba = +(paddy_forest_crop_details.reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)),
            totalRakba = +(rg_land_details.reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + total_forest_paddy_rkba,
            rakbaOfPaddy = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + total_forest_paddy_rkba,
            maizeRakba = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 103 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)),
            ip_address = sessionDetails['ip_address'];
        let sendObj = {}, sendArray = [];
        async.series([
            // make main array for send into food api 
            function (cback3) {
                let data = params["basic_details"];
                let { dob } = data["mas_farmer"];
                sendObj["FarmerCode"] = data1.farmer_code;
                sendObj['DOB'] = dob;
                sendObj["FarmerRegKhasraDetailsList"] = food_s.convertLandForFood({ uf_id, fs_id, currentDateTime, farmer_code: data1.farmer_code, type: 4 }, rg_land_details, params['crop_details']);
                sendObj["FarmerAreaUsageDetailsList"] = food_s.convertRgCropForFood({ uf_id, fs_id, currentDateTime, farmer_code: data1.farmer_code, type: 4 }, paddy_maize_rg_Crop);
                sendObj["FarmerVanGramPaataNoList"] = food_s.convertForestCropForFood({ uf_id, fs_id, currentDateTime, farmer_code: data1.farmer_code, type: 4 }, paddy_forest_crop_details);
                sendArray.push(sendObj);
                //console.log('sendobj-->', sendObj)
                return cback3()
            },
            //check validation and call food api
            function (cback4) {
                const { error, value } = userValidations.FoodUpdateLandCropObjectValidation(sendArray, data1['entry_type']);
                if (error && error.details) {
                    return cback4(error.details[0].message);

                } else {
                    food_s.ApiCall(apiURLSansodhanFarmerDetail, value, function (err, res) {
                        if (err) {
                            return cback4(err)
                        } else {
                            food_response = res
                            return cback4(null, res)
                        }
                    })

                }
            }
        ],
            function (err, res) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, food_response);
                }
            })
    },
    //varisan farmer --- need to update
    foodApiAddVarisanKisan: function (dbkey, data1, params, sessionDetails, callback) {
        if (!(params && data1.uf_id && data1.fs_id && data1.varisanOldFarmerCode)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        let { uf_id, fs_id, rg_land_details, paddy_maize_rg_Crop, paddy_forest_crop_details, currentDateTime } = food_s.convertObjectForFood(data1, params)
        let total_forest_paddy_rkba = +(paddy_forest_crop_details.reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)),
            totalRakba = +(rg_land_details.reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + total_forest_paddy_rkba,
            rakbaOfPaddy = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + total_forest_paddy_rkba,
            maizeRakba = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 103 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)),
            ip_address = sessionDetails['ip_address'];
        let sendObj = {}, sendArray = [], food_response, FarmerRepresentativeList = [];
        async.series([
            // make main array for send into food api 
            function (cback3) {
                let data = params["basic_details"];
                let varisanOldFarmerCode = data1["varisanOldFarmerCode"];
                let { farmer_name_aadhar, farmer_name_hi, relation, father_name, caste_code, subcaste_code,
                    gender, address, aadhar_number, mobile_no, dob } = data["mas_farmer"];
                let { society_id, account_no, bank_code, branch_code, ifsc_code, village_code } = data["farmer_society"];
                let { Name, Relation, TypeofPerson, AadharNo, UserID } = data["farmer_representative"];
                let g = gender == 'M' ? 'पुरुष' : 'महिला';
                sendObj["District"] = sessionDetails['district_id'].toString();
                sendObj["Society"] = society_id.toString();
                sendObj["FarmerName"] = farmer_name_hi;
                sendObj["FarmerCode"] = uf_id;
                sendObj["Sex"] = g;
                sendObj["Father_HusbandName"] = father_name;
                sendObj["Relation"] = relation == 'F' ? 'पिता' : 'पति';
                sendObj["Caste"] = caste_code.toString();
                sendObj["SubCaste"] = subcaste_code.toString();
                sendObj["Address"] = address;
                sendObj["TotalRakba"] = totalRakba.toFixed(4);
                sendObj["RakbaOfPaddy"] = rakbaOfPaddy.toFixed(4);
                sendObj["MaizeRakba"] = maizeRakba.toFixed(4);
                sendObj["AccountNo"] = account_no;
                sendObj["BankName"] = bank_code.toString();
                sendObj["BranchName"] = branch_code.toString();
                sendObj["IFSCCode"] = ifsc_code.toString();
                sendObj["RationCardNo"] = "NA";
                sendObj["AadharNo"] = aadhar_number.toString();
                sendObj["AadharName"] = farmer_name_aadhar;
                sendObj["MobileNo"] = mobile_no.toString();
                sendObj["NewVLocationCode"] = village_code.toString();
                sendObj["IPAddress"] = ip_address;
                sendObj["DateTimeStamp"] = currentDateTime;
                sendObj["DateofPanjiyan"] = currentDateTime;
                sendObj["SocietyMemberShipNo"] = "NA";
                sendObj["LastFourDigit"] = getLastFourDigits(aadhar_number);
                sendObj["fs_id"] = fs_id;
                sendObj['DOB'] = dob
                sendObj['OLDFarmerName'] = varisanOldFarmerCode;
                FarmerRepresentativeList.push({
                    "FarmerCode": uf_id, "TypeofPerson": TypeofPerson, "Name": Name, "Relation": Relation, "AadharNo": AadharNo,
                    "FourDigit": getLastFourDigits(AadharNo), "IPAddress": ip_address,
                    "UserID": UserID + '', "Opration": "Insert", "EntryDateTime": currentDateTime, "LastUpdateDate": currentDateTime
                })
                sendObj["FarmerRegKhasraDetailsList"] = food_s.convertLandForFood({ uf_id, fs_id, currentDateTime }, rg_land_details, params['crop_details']);
                sendObj["FarmerAreaUsageDetailsList"] = food_s.convertRgCropForFood({ uf_id, fs_id, currentDateTime }, paddy_maize_rg_Crop);
                sendObj["FarmerVanGramPaataNoList"] = food_s.convertForestCropForFood({ uf_id, fs_id, currentDateTime }, paddy_forest_crop_details);
                sendObj["FarmerRepresentativeList"] = FarmerRepresentativeList;
                sendArray.push(sendObj);
                //console.log(sendObj);
                return cback3()
            },
            //check validation and call food api
            function (cback4) {
                const { error, value } = userValidations.FoodNewFarmerObjectValidation(sendArray, data1['entry_type']);
                if (error && error.details) {
                    return cback4({ message: `in food api varisan new farmer object :- ${error.details[0].message}`, errno: 1001, uf_id: uf_id });
                } else {
                    food_s.ApiCall(apiURLInsertNewVarsionFarmer, sendArray, function (err, res) {
                        if (err) {
                            return cback4(err)
                        } else {
                            food_response = res
                            return cback4(null, res)
                        }
                    })

                }
            }
        ],
            function (err, res) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, food_response);
                }
            })
    },
    // varisan sansodhan farmer --- need to update
    foodApiVarisanSansodhanKisan: function (dbkey, data1, params, sessionDetails, callback) {
        if (!(params && data1.uf_id && data1.fs_id && data1.farmer_code && params["varisanOldFarmerCode"])) {
            return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': `in foodApiVarisanSansodhanKisan mandatory fields is missing` })
        }
        let varisanOldFarmerCode = params["varisanOldFarmerCode"];
        let farmer_code = data1['farmer_code'], food_response;
        let { uf_id, fs_id, rg_land_details, paddy_maize_rg_Crop, paddy_forest_crop_details, currentDateTime } = food_s.convertObjectForFood(data1, params)
        let total_forest_paddy_rkba = +(paddy_forest_crop_details.reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)),
            totalRakba = +(rg_land_details.reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + total_forest_paddy_rkba,
            rakbaOfPaddy = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + total_forest_paddy_rkba,
            maizeRakba = +(paddy_maize_rg_Crop.reduce((acc, cur) => cur['crop_code'] == 103 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)),
            ip_address = sessionDetails['ip_address'];
        let sendObj = {}, sendArray = [];
        async.series([
            // make main array for send into food api 
            function (cback3) {
                let { dob } = params['basic_details']['mas_farmer']
                sendObj["OLDFarmerName"] = varisanOldFarmerCode;
                sendObj["FarmerCode"] = farmer_code;
                sendObj['DOB'] = dob;
                sendObj["Society"] = params['society_id'].toString();
                sendObj["FarmerRegKhasraDetailsList"] = food_s.convertLandForFood({ uf_id, fs_id, currentDateTime, farmer_code: data1.farmer_code, type: 4 }, rg_land_details, params['crop_details']);
                sendObj["FarmerAreaUsageDetailsList"] = food_s.convertRgCropForFood({ uf_id, fs_id, currentDateTime, farmer_code: data1.farmer_code, type: 4 }, paddy_maize_rg_Crop);
                sendObj["FarmerVanGramPaataNoList"] = food_s.convertForestCropForFood({ uf_id, fs_id, currentDateTime, farmer_code: data1.farmer_code, type: 4 }, paddy_forest_crop_details);
                sendArray.push(sendObj);
                return cback3()
            },
            //check validation and call food api
            function (cback4) {
                const { error, value } = userValidations.FoodUpdateLandCropObjectValidation(sendArray, data1['entry_type']);
                if (error && error.details) {
                    return cback4({ message: `in food api varisan sansodhan farmer object :- ${error.details[0].message}`, errno: 1001, uf_id: uf_id });
                } else {
                    food_s.ApiCall(apiURLUpdateVarisonFarmeronExistingSociety, sendArray, function (err, res) {
                        if (err) {
                            return cback4(err)
                        } else {
                            food_response = res
                            return cback4(null, res)
                        }
                    })

                }
            },
        ],
            function (err, res) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, food_response);
                }
            })
    },

    // deletion service
    rejectFarmerOnFoodDept: function (dbkey, request, params, sessionDetails, callback) {
        let reason = params["remark"];
        let farmer_code = params["farmer_code"], deleteObjList = [],food_response;
        async.series([
            function (cback1) {
                let obj = {
                    "FarmerCode": farmer_code, "Opration": "Deleted", "ReasonForDelete": reason,
                    "IPAddress": sessionDetails["ip_address"]
                };
                deleteObjList.push(obj);
                return cback1();
            },
            function (cback2) {
                const { error, value } = userValidations.FoodDeleteFarmerObjectValidation(deleteObjList);
                if (error && error.details) {
                    return cback2(error.details[0].message);

                } else {
                    food_s.ApiCall(farmerDeleteFoodApi, value, function (err, res) {
                        if (err) {
                            return cback2(err)
                        } else {
                            food_response =res
                            return cback2(null, res)
                        }
                    })

                }
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null,food_response)
            }
        })
    },
    foodApiNominneDetailsUpdate: function (dbkey, data1, params, sessionDetails, callback) {
        let sendObj = {}, sendArray = [],food_response;
        let currentDateTime = format('yyyy-MM-dd hh:mm:ss', new Date());
        let entryDateTime = format('yyyy-MM-dd hh:mm:ss', data1['EntryDateTime'])
        async.series([
            function (cback1) {
                sendObj = {
                    "FarmerCode": params['FarmerCode'],
                    "TypeofPerson": params['TypeofPerson'],
                    Name: params['Name'],
                    Relation: params['Relation'],
                    AadharNo: params['AadharNo'],
                    FourDigit: getLastFourDigits(params['AadharNo']),
                    IPAddress: sessionDetails['ip_address'],
                    UserID: sessionDetails['user_id'],
                    Opration: "Update",
                    EntryDateTime: entryDateTime,
                    LastUpdateDate: currentDateTime
                }
                sendArray.push(sendObj);
                return cback1();
            },
            function (cback2) {
                const { error, value } = userValidations.FoodNomineeupdateObjectValidation(sendArray);
                if (error && error.details) {
                    return cback2(error.details[0].message);

                } else {
                    food_s.ApiCall(apiURlUpdateFarmerRepresentative, value, function (err, res) {
                        if (err) {
                            return cback2(err)
                        } else {
                            food_response = res
                            return cback2(null, res)
                        }
                    })

                }
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null,food_response)
            }
        })
    },
    ApiCall: function (url, data, callback) {
        if (!(url && data)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        let options = { url: url, json: true, body: data }
        req.post(options, function (error, response, body) {
            if (error) {
                return callback(error)
            }
            else {
                //  try {
                if (typeof (body) !== 'object') {
                    body = JSON.parse(body)
                };
                if (body && (body['Status'] == 1 || body["Msg"] == "ALREADYEXISTS")) {
                    return callback(null, body)
                } else if (body && body['Status'] == 5) {
                    return callback({ message: `food api error - ${body['Msg']}`, 'farmer_code': body['FarmerCode'], 'code': 5 })
                } else if (body && body['Status'] == 6) {
                    return callback({ message: `food api error - ${body['Msg']}`, 'farmer_code': body['FarmerCode'], 'code': 6 })
                }
                else {
                    return callback({ message: `food api error - ${body['Msg'] ?? body['Message']}` })
                }
                // } catch (e) {
                //     console.log(e);
                //     return callback(e)
                // }
            }
        })
    },

    convertObjectForFood: function (data1, params) {
        let uf_id = data1['uf_id'] + '';
        let fs_id = data1['fs_id'] + '';
        let rg_land_details = params["land_details"];
        let paddy_maize_rg_Crop = params["crop_details"].filter(function (e) { return e['crop_code'] == 104 || e["crop_code"] == 103 });
        let paddy_forest_crop_details = params["forest_crop_details"].filter(function (e) { return e['crop_code'] == 104 });
        let currentDateTime = format('yyyy-MM-dd hh:mm:ss', new Date());
        return { uf_id, fs_id, rg_land_details, paddy_maize_rg_Crop, paddy_forest_crop_details, currentDateTime }
    },
    convertLandForFood: function (basic_data, rg_land_details = [], crop_details = []) {
        let FarmerRegKhasraDetailsList = []
        rg_land_details.forEach(element => {
            let { Khasra_No, VillageCensus, Basra_No, OwnerName, FarmSize, OwnerType, LastUpdatedOn } = element;
            let g_status = crop_details.some(function (e) {
                return (e.village_code == VillageCensus && e.khasra_no == Khasra_No && e.girdawari_status == 'Y');
            });

            let obj = {
                "FarmerCode": basic_data['uf_id'], "KhasraNo": Khasra_No, "VLocationCode": VillageCensus, "Operation": "Insert", "Datetimestamp": basic_data['currentDateTime'],
                "Locked": Basra_No, "Transferred": OwnerName, "RakbaOfPaddy": FarmSize, "Status": g_status == true ? 'Y' : 'N', "OwnerType": OwnerType, "LastUpdateDate": LastUpdatedOn,
                "uf_id": basic_data['uf_id'], "fs_id": basic_data['fs_id']
            };
            if (basic_data.type && basic_data.type == 4) {
                obj["FarmerCode"] = basic_data['farmer_code']
                obj["Operation"] = 'Update'
            }
            FarmerRegKhasraDetailsList.push({ ...obj });
        });
        return FarmerRegKhasraDetailsList;
    },
    convertForestCropForFood: function (basic_data, paddy_forest_crop_details = []) {
        let FarmerVanGramPaataNoList = []
        paddy_forest_crop_details.forEach(element => {
            let { khasra_no, village_code, crop_area } = element;
            let obj = {
                "FarmerCode": basic_data['uf_id'], "KhasraNo": khasra_no, "VLocationCode": village_code + "", "Operation": "Update", "Datetimestamp": basic_data['currentDateTime'], "RakbaOfPaddy": crop_area,
                "uf_id": basic_data['uf_id'], "fs_id": basic_data['fs_id']
            };
            if (basic_data.type && basic_data.type == 4) {
                // obj["FarmerCode"] =  basic_data['farmer_code']
                obj["Operation"] = 'Update'
            }
            FarmerVanGramPaataNoList.push({ ...obj });
        });
        return FarmerVanGramPaataNoList;
    },
    convertRgCropForFood: function (basic_data, paddy_maize_rg_Crop = []) {
        let FarmerAreaUsageDetailsList = []
        paddy_maize_rg_Crop.forEach(crop => {
            crop['girdawari_status'] = crop['girdawari_status'] == null ? 'N' : crop['girdawari_status'];
            let { village_code, khasra_no, crop_code, crop_area, girdawari_status } = crop;
            let areaType = crop_code == 104 ? 1 : 2;
            let obj = {
                "FarmerCode": basic_data['uf_id'], "KhasraNo": khasra_no, "VLocationCode": village_code.toString(), "AreaUsage": crop_area.toString(), "AreaType": areaType,
                "DateTimeStamp": basic_data['currentDateTime'],
                "Locked": girdawari_status, "Transferred": '1',
                "uf_id": basic_data['uf_id'], "fs_id": basic_data['fs_id']
            };
            if (basic_data.type && basic_data.type == 4) {
                obj["FarmerCode"] = basic_data['farmer_code']
                obj["Operation"] = 'Update'
            }
            FarmerAreaUsageDetailsList.push({ ...obj });
        });
        return FarmerAreaUsageDetailsList;

    },


}

module.exports = food_s