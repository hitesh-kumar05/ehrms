var securityService = global.SECURITY_SERVICE;
var prefix = global.apiPrefix;
let service_file = 'aadhar'

var init = function (app) {
    app.get(prefix + '/aadhar/get/:function_name', function (req, res, next) {
        let perm = '12';
        securityService.commonFunctionToCall(service_file, req.params['function_name'], req, res, req.query, perm, false);
    });

    app.post(prefix + '/aadhar/post/:function_name', function (req, res, next) {
        let perm = '12';
        securityService.commonFunctionToCall(service_file, req.params['function_name'], req, res, req.body, perm, false);
    });
    app.get(prefix + '/outer/get/:function_name', function (req, res, next) {
        let perm = '12';
        securityService.commonFunctionToCall('outer', req.params['function_name'], req, res, req.query, perm, false);
    });
}

module.exports.init = init;