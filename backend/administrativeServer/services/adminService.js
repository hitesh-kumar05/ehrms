var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var securityService = require('./securityservice.js');
var ADMIN_QUERIES = require('../queries/adminQueries.js');
var async = require('async');
const { performance } = require('perf_hooks');
const { exec } = require('child_process');


let admin = {
    // menu services/
    getUserTypeForPassResetOnAdmin: function (dbkey, request, params, sessionDetails, callback) {
        dbkey = CONFIG_PARAMS.getUfpDBDetails();
        let qAndP = ADMIN_QUERIES.getUserTypeForPassResetOnAdmin();
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },

    getMenuList: (dbkey, request, params, sessionDetails, callback) => {
        let usertype = params['usertype']
        let qAndP = ADMIN_QUERIES.getMenuList(usertype);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },

    deleteMenuUsingMenuCode: (dbkey, request, params, sessionDetails, callback) => {
        if (!(params.menu_code)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let menu_code = +params['menu_code']
        let qAndP = DB_SERVICE.getDeleteQueryAndparams({ 'menuCode': menu_code }, 'mas_menu');
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },

    disableActiveMenu: (dbkey, request, params, sessionDetails, callback) => {
        if (!(params.menu_code && (params.status == true || params.status == false))) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let menu_code = +params['menu_code']
        let status = params['status']
        let qAndP = DB_SERVICE.getUpdateQueryAndparams({ 'is_active': status }, { 'menuCode': menu_code }, 'mas_menu');
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },
    addNewMenu: (dbkey, request, params, sessionDetails, callback) => {
        let qAndP = ADMIN_QUERIES.addNewMenu(params);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },
    updateMenu: (dbkey, request, params, sessionDetails, callback) => {
        //console.log(params);
        let updateObj = { name: params.name, route: params.route, menuOrder: params.menuOrder, icon: params.icon, is_new: params.is_new, usertype: params.usertype, children: params.children == null ? 0 : params.children }
        let qAndP = DB_SERVICE.getUpdateQueryAndparams(updateObj, { 'menuCode': params.menuCode }, 'mas_menu');
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },
    /* ============================================
Slow Query
==============================================*/
    slowQueryList: (dbkey, request, params, sessionDetails, callback) => {
        let size = +params["size"];
        let page = +params["page"];
        let offset = page * size;
        let qAndParamArray = ADMIN_QUERIES.slowQueryList(offset, size);
        DB_SERVICE.executeMultiSelQueriesWithParameters(dbkey, qAndParamArray, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            return callback(null, { "data": r1.data[0], "total": r1.data[1][0]["total"] });
        });

    },
    slowQueryStatus: (dbkey, request, params, sessionDetails, callback) => {
        let qAndP = ADMIN_QUERIES.slowQueryStatus(params.sid, params.status);
        console.log(qAndP);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },
    checkQueryPerformance: (dbkey, request, params, sessionDetails, callback) => {
        let s_id = params['s_id']
        const start = performance.now();
        let query_execution, explain, query;
        async.series([
            function (c0) {
                const q = `SELECT s.query FROM slow_queries s WHERE s.sid = ${s_id}`
                DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (e1, r1) {
                    if (e1) {
                        c0(e1);
                    } else {
                        query = r1.data[0].query
                        c0();
                    }
                })
            },
            function (c11) {
                const explain_qry = `explain ${query}`
                DB_SERVICE.executeQueryWithParameters(dbkey, explain_qry, [], function (e1, r1) {
                    if (e1) {
                        return c11(e1);
                    }
                    else {
                        explain = r1.data;
                        return c11(null);
                    }
                })
            },

        ], function (err, res) {
            if (err) {
                return callback(err)
            }
            else {
                return callback(null, explain);
            }
        })
    },
    //// session ///
    showSessionList: (dbkey, request, params, sessionDetails, callback) => {
        let qAndP = ADMIN_QUERIES.showSessionList(params);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },

    terminateUserSession: (dbkey, request, params, sessionDetails, callback) => {
        let qAndP = ADMIN_QUERIES.terminateUserSession(params);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },
    //processlist//
    processList: (dbkey, request, params, sessionDetails, callback) => {
        let server = +params['server']
        let db_key = server == 244 ? dbkey : CONFIG_PARAMS.getLiveBaseDBDetails();
        let q = `SELECT p.HOST, p.DB, p.TIME, p.INFO, p.QUERY_ID, p.ID FROM information_schema.PROCESSLIST p where p.COMMAND <> 'Sleep' ORDER BY p.TIME DESC`
        DB_SERVICE.executeQueryWithParameters(db_key, q, [], function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },

    killProcess: (dbkey, request, params, sessionDetails, callback) => {
        let server = +params['server']
        let query_id = +params['query_id']
        let db_key = server == 244 ? dbkey : CONFIG_PARAMS.getLiveBaseDBDetails();
        let q = `KILL QUERY ID ${query_id}`
        DB_SERVICE.executeQueryWithParameters(db_key, q, [], function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },


    //error log
    errorLog: (dbkey, request, params, sessionDetails, callback) => {
        let user_id = +params["user_id"];
        let size = +params["size"];
        let page = +params["page"];
        let offset = page * size;
        let new_data, total
        let qAndP = ADMIN_QUERIES.errorLog(offset, size, user_id);
        async.series([
            function (c1) {
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP[0].query, qAndP[0].params, function (e1, r1) {
                    if (e1) {
                        return c1(e1);
                    }
                    else {
                        new_data = r1.data;
                        return c1(null);
                    }
                })
            },
            function (c11) {
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP[1].query, qAndP[1].params, function (e1, r1) {
                    if (e1) {
                        return c11(e1);
                    }
                    else {
                        console.log(r1.data);
                        total = r1.data[0].total
                        return c11(null);
                    }
                })
            },

        ], function (err, res) {
            if (err) {
                return callback(err)
            }
            else {
                return callback(null, { data: new_data, total: total });
            }
        })
    },

    RefreshReportTable: (dbkey, request, params, sessionDetails, callback) => {
        let type = +params['type'], qAndP, db_key
        if (type == 2) {
            db_key = CONFIG_PARAMS.getWorkingDBDetails()
            qAndP = ADMIN_QUERIES.RefreshReportTable();;
        }
        if (type == 1) {
            db_key = CONFIG_PARAMS.getWorkingBaseDBDetails()
            qAndP = ADMIN_QUERIES.RefereshRGKNYTable()
        }
        DB_SERVICE.executeQueryWithParameters(db_key, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },

    checkApplicationSize: (dbkey, request, params, sessionDetails, callback) => {
        let resSend = []
        async.series([
            function (c1) {
                const command = 'df -h';
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error executing command: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.error(`Command stderr: ${stderr}`);
                    }
                    try {
                        const lines = stdout.trim().split('\n');
                        const header = lines[0].split(/\s+/); // Assuming the first line is the header
                        const data = lines.slice(1).map((line) => {
                            const values = line.trim().split(/\s+/);
                            const entry = {};
                            header.forEach((key, index) => {
                                entry[key] = values[index];
                            });
                            return entry;
                        });
                        resSend.push(data)
                        c1()
                    } catch {
                        c1()
                    }

                });
            }
        ], function (err, res) {
            if (err) {
                return callback(err)
            }
            else {
                return callback(null, resSend);
            }
        })
    },

    /* ============================================
Ganna Report
==============================================*/
    GannaPanjiyanDistrictWise: (dbkey, request, params, sessionDetails, callback) => {
        let qAndP = ADMIN_QUERIES.GannaPanjiyanDistrictWise(params);
        let db = CONFIG_PARAMS.getGannaDBDetails();
        DB_SERVICE.executeQueryWithParameters(db, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },

    GannaPanjiyanSocietywise: (dbkey, request, params, sessionDetails, callback) => {
        let qAndP = ADMIN_QUERIES.GannaPanjiyanSocietywise(params);
        let db = CONFIG_PARAMS.getGannaDBDetails();
        DB_SERVICE.executeQueryWithParameters(db, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    },

    GannaPanjiyanUserwise: (dbkey, request, params, sessionDetails, callback) => {
        let qAndP = ADMIN_QUERIES.GannaPanjiyanUserwise(params);
        let db = CONFIG_PARAMS.getGannaDBDetails();
        DB_SERVICE.executeQueryWithParameters(db, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                callback(e1);
            } else {
                callback(null, r1.data);
            }
        })
    }
}
module.exports = admin












