var securityService = global.SECURITY_SERVICE;
var prefix = global.apiPrefix;
const fileUpload = require("express-fileupload");

var init = function (app) {
    app.get(prefix + '/newReg/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('newregistrationService', req.params['function_name'], req, res, req.query, perm, true);
    });

    app.post(prefix + '/newReg/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('newregistrationService', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.post(prefix + '/carryForward/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('carryForwardService', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.post(prefix + '/trustCarryForward/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('trustCarryForwardService', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.post(prefix + '/aadharNullFarmer/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('aadharNullFarmerService', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.post(prefix + '/sansodhan/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('sansodhanService', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.post(prefix + '/varishan/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('varishanService', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.post(prefix + '/rejection/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('rejectionService', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.post(prefix + '/rejection/postFile/:function_name', fileUpload({createParentPath : true, limits : {fileSize : 500 * 1024},abortOnLimit: true }), function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('rejectionService', req.params['function_name'], req, res, req.body, perm, true);
    });
    app.get(prefix + '/dept/get/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('newregistrationService', req.params['function_name'], req, res, req.query, perm, true);
    });

    app.post(prefix + '/dept/post/:function_name', function (req, res, next) {
        let perm = '12'
        securityService.commonFunctionToCall('deptService', req.params['function_name'], req, res, req.body, perm, true);
    });
}

module.exports.init = init;