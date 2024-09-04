const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors({
    credentials: true,
    origin: true,
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));


var getDbKey = function (req, callback) {
    return callback(null, global.COMMON_CONFS.getWorkingDBDetails());
}

app.use((req, res, next) => {
    getDbKey(req, function (dbkeyErr, dbkey, possibleRootuserId) {
        req.query.dbkey = dbkey;
        
        next();
    });
})

var initAllFiles = function () {
    global.apiPrefix = '/otherApi24';
    global.COMMON_CONFS = require('./commonutils/commonconfs.js').ConfigParams;// call configParams, common configurations are stored here.
    global.DB_SERVICE = require('./services/mysqldbservice.js');
    global.SECURITY_SERVICE = require('./services/securityservice.js');

    require('./routes/masterroutes.js').init(app);
    //only init method of all below files are called and pass app.
}

initAllFiles();
module.exports = app;