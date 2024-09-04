const config = require('config');

var confs = {
    server_176_login_db: {
        host: config.get('server_176_login_db.host'),
        user: config.get('server_176_login_db.user'),
        password: config.get('server_176_login_db.password'),
        database: config.get('server_176_login_db.database'),
    },
    ufp_db: {
        host: config.get('ufp_db.host'),
        user: config.get('ufp_db.user'),
        password: config.get('ufp_db.password'),
        database: config.get('ufp_db.database'),
    },
    procurement_db: {
        host: config.get('procurement_db.host'),
        user: config.get('procurement_db.user'),
        password: config.get('procurement_db.password'),
        database: config.get('procurement_db.database'),
    },

    procurement_base_db: {
        host: config.get('procurement_base_db.host'),
        user: config.get('procurement_base_db.user'),
        password: config.get('procurement_base_db.password'),
        database: config.get('procurement_base_db.database'),
    },

    live_db: {
        host: config.get('live_db.host'),
        user: config.get('live_db.user'),
        password: config.get('live_db.password'),
        database: config.get('live_db.database'),
    },

    live_base_db: {
        host: config.get('live_base_db.host'),
        user: config.get('live_base_db.user'),
        password: config.get('live_base_db.password'),
        database: config.get('live_base_db.database'),
    },


    common_db: {
        host: config.get('common_db.host'),
        user: config.get('common_db.user'),
        password: config.get('common_db.password'),
        database: config.get('common_db.database'),
    },

    getCommonDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.common_db));
    },

    getWorkStationDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.common_db));
    },

    getServer176LoginDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.server_176_login_db));
    },
    getUfpDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.common_db));
    },
    getWorkingDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.common_db));
    },
    getWorkingBaseDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.common_db));
    },
    getLiveDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.live_db));
    },
    getLiveDBNewDetails: function () {
        return JSON.parse(JSON.stringify(confs.live_db));
    },
    getLiveBaseDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.live_base_db));
    },

}





module.exports.ConfigParams = confs;