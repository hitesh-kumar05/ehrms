let securityService = global.SECURITY_SERVICE;
let prefix = global.apiPrefix;
var CONFIG_PARAMS = global.COMMON_CONFS;

var init = function (app) {
    app.get(prefix + '/society/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('society', req.params['function_name'], req, res, req.query, perm, true);
    });


    app.post(prefix + '/society/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('society', req.params['function_name'], req, res, req.body, perm, true);
    });

    app.get(prefix + '/admin/get/:function_name', function (req, res, next) {
        let perm = '12'
        req.query.dbkey = CONFIG_PARAMS.getUfpDBDetails();
        securityService.commonFunctionToCall('admin', req.params['function_name'], req, res, req.query, perm, true);
    });

    app.post(prefix + '/admin/post/:function_name', function (req, res, next) {
        let perm = '12'
        req.query.dbkey = CONFIG_PARAMS.getUfpDBDetails();
        securityService.commonFunctionToCall('admin', req.params['function_name'], req, res, req.body, perm, true);
    });

    app.get(prefix + '/raeo/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('raeo', req.params['function_name'], req, res, req.query, perm, true);
    });

    app.post(prefix + '/raeo/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('raeo', req.params['function_name'], req, res, req.body, perm, true);
    });

    app.get(prefix + '/sado/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('sado', req.params['function_name'], req, res, req.query, perm, true);
    });

    app.post(prefix + '/sado/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('sado', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.get(prefix + '/dda/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('dda', req.params['function_name'], req, res, req.query, perm, true);
    });

    app.post(prefix + '/dda/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('dda', req.params['function_name'], req, res, req.body, perm, true);
    });
}

module.exports.init = init;