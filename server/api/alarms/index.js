/**
 * 'api/alarms': Alarms API to GET/POST alarms data
 */

var express = require("express");
var runtime;
var secureFnc;
var checkGroupsFnc;

module.exports = {
    init: function (_runtime, _secureFnc, _checkGroupsFnc) {
        runtime = _runtime;
        secureFnc = _secureFnc;
        checkGroupsFnc = _checkGroupsFnc;
    },
    app: function() {
        var alarmsApp = express();
        alarmsApp.use(function(req, res, next) {
            if (!runtime.project) {
                res.status(404).end();
            } else {
                next();
            }
        });

        /**
         * GET current Alarms 
         * Take from alarms storage and reply 
         */
        alarmsApp.get("/api/alarms", secureFnc, function(req, res) {
            var groups = checkGroupsFnc(req);
            try {
                var result = runtime.alarmsMgr.getAlarmsValues(req.query, groups);
                // res.header("Access-Control-Allow-Origin", "*");
                // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                if (result) {
                    res.json(result);
                } else {
                    res.end();
                }
            } catch (err) {
                if (err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api get alarms: " + err.message);
            }
        });

                /**
         * GET current Alarms 
         * Take from alarms storage and reply 
         */
        alarmsApp.get("/api/alarmsHistory", secureFnc, function(req, res) {
            var groups = checkGroupsFnc(req);
            runtime.alarmsMgr.getAlarmsHistory(req.query, groups).then(result => {
                // res.header("Access-Control-Allow-Origin", "*");
                // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                if (result) {
                    res.json(result);
                } else {
                    res.end();
                }
            }).catch(function(err) {
                if (err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api get alarms: " + err.message);
            });
        });

        /**
         * POST Alarm ACK
         * Set alarm ack
         */
        alarmsApp.post("/api/alarmack", secureFnc, function(req, res, next) {
            var groups = checkGroupsFnc(req);
            runtime.alarmsMgr.setAlarmAck(req.body.params, req.userId, groups).then(function(data) {
                res.end();
            }).catch(function(err) {
                if (err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api post alarm-ack: " + err.message);
            });
        });

        /**
         * POST Alarms clear
         */
        alarmsApp.post("/api/alarmsClear", secureFnc, function(req, res, next) {
            var groups = checkGroupsFnc(req);
            runtime.alarmsMgr.clearAlarms(req.body.params).then(function() {
                runtime.alarmsMgr.reset();
                res.end();
            }).catch(function(err) {
                if (err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api post alarms-clear: " + err.message);
            });
        });
        return alarmsApp;
    }
}
