var securityService = global.SECURITY_SERVICE;
var prefix = global.apiPrefix;
let service_file = 'master'

var init = function (app) {
    app.get(prefix + '/master/get/:function_name', function (req, res, next) {
        let perm = '12';
        securityService.commonFunctionToCall(service_file, req.params['function_name'], req, res, req.query, perm, true)
    });

    app.post(prefix + '/master/post/:function_name', function (req, res, next) {
        let perm = '12';
        securityService.commonFunctionToCall(service_file, req.params['function_name'], req, res, req.body, perm, true);
    });
}

module.exports.init = init;