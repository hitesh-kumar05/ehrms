let securityService = global.SECURITY_SERVICE;
let prefix = global.apiPrefix;
let service_file = 'common'

var init = function (app) {
    app.get(prefix + '/common/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall(service_file, req.params['function_name'], req, res, req.query, perm, true);
    });

    app.get(prefix + '/farmer/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('farmer', req.params['function_name'], req, res, req.query, perm, true);
    });

    app.post(prefix + '/farmer/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('farmer', req.params['function_name'], req, res, req.body, perm, true);
    });

    app.get(prefix + '/bhuiyan/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('bhuiyan', req.params['function_name'], req, res, req.query, perm, true);
    });

    app.get(prefix + '/list/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('list', req.params['function_name'], req, res, req.query, perm, true);
    });
    app.post(prefix + '/list/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('list', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.post(prefix + '/common/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall(service_file, req.params['function_name'], req, res, req.body, perm, true);
    });

    app.get(prefix + '/report/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('report', req.params['function_name'], req, res, req.query, perm, true);
    });
    app.post(prefix + '/report/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('report', req.params['function_name'], req, res, req.body, perm, true);
    });
}

module.exports.init = init;