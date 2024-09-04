const config = require('config');

var confs = {
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

    aadhar_vault_db: {
        host: config.get('aadharVaultDB.host'),
        user: config.get('aadharVaultDB.user'),
        password: config.get('aadharVaultDB.password'),
        database: config.get('aadharVaultDB.database'),
    },

    getCommonDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.procurement_db));
    },

    getWorkStationDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.procurement_db));
    },

    getUfpDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.ufp_db));
    },
    getWorkingDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.procurement_db));
    },
    getWorkingBaseDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.procurement_base_db));
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
    getAadharVaultDBDetails: function () {
        return JSON.parse(JSON.stringify(confs.aadhar_vault_db));
    }
}





module.exports.ConfigParams = confs;