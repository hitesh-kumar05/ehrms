var securityService = global.SECURITY_SERVICE;
var prefix = global.apiPrefix;

var init = function (app) {
    app.post(prefix + '/file/registrationReciept/:fs_id', function (req, res, next) {
        var perm = '12';
        securityService.commonFunctionToCall('file', "registrationReciept", req, res, req.params, perm, false, function (err, buffer) {
            if (err) {
                res.status(204).send('null')
            } else {
                res.setHeader('X-Filename', 'report.pdf');
                res.end(buffer);
            }
        });
    });
    app.post(prefix + '/file/htmltoPdf', function (req, res, next) {
        var perm = '12';
        securityService.commonFunctionToCall('file', "htmltoPdf", req, res, req.body, perm, false, function (err, buffer) {
            if (err) {
                console.log(err);
                res.status(204).send({'error': err})
            } else {
                res.setHeader('X-Filename', 'report.pdf');
                res.end(buffer);
            }
        });
    });
}

module.exports.init = init;