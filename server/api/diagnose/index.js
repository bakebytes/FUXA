/**
 * 'api/logs': Diagnose API to GET logs data
 */

const fs = require('fs');
const path = require('path');
var express = require("express");
const authJwt = require('../jwt-helper');
var runtime;
var secureFnc;
var checkGroupsFnc;

module.exports = {
    init: function (_runtime, _secureFnc, _checkGroupsFnc) {
        runtime = _runtime;
        secureFnc = _secureFnc;
        checkGroupsFnc = _checkGroupsFnc;
    },
    app: function () {
        var diagnoseApp = express();
        diagnoseApp.use(function (req, res, next) {
            if (!runtime.project) {
                res.status(404).end();
            } else {
                next();
            }
        });

        /**
         * GET Server logs folder content
         */
        diagnoseApp.get('/api/logsdir', function (req, res) {
            var groups = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api get logsdir: Tocken Expired");
            } else {
                try {
                    var logPath = runtime.logger.logDir();
                    if (!fs.existsSync(logPath)) {
                        logPath = path.join(process.cwd(), runtime.logger.logDir());
                    }
                    var logFiles = fs.readdirSync(logPath);
                    res.json(logFiles);
                } catch (err) {
                    if (err.code) {
                        res.status(400).json({ error: err.code, message: err.message });
                    } else {
                        res.status(400).json({ error: "unexpected_error", message: err.toString() });
                    }
                    runtime.logger.error("api get logsdir: " + err.message);
                }
            }
        });

        /**
         * GET Server logs data
         */
        diagnoseApp.get('/api/logs', function (req, res) {
            var groups = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api get logs: Tocken Expired");
            } else {
                try {
                    var logFileName = req.query.file || 'fuxa.log';
                    var logPath = runtime.logger.logDir();
                    if (!fs.existsSync(logPath)) {
                        logPath = path.join(process.cwd(), runtime.logger.logDir());
                    }
                    var logFiles = fs.readdirSync(logPath);
                    let logFile = path.join(logPath, logFileName);
                    res.header('Content-Type', 'text/plain; charset=utf-8');
                    res.download(logFile, (err) => {
                        if (err) {
                            res.status(500).send({
                                message: "Could not download the file. " + err,
                            });
                            runtime.logger.error("api get logs: " + err);
                        }
                    });
                } catch (err) {
                    if (err.code) {
                        res.status(400).json({ error: err.code, message: err.message });
                    } else {
                        res.status(400).json({ error: "unexpected_error", message: err.toString() });
                    }
                    runtime.logger.error("api get logs: " + err.message);
                }
            }
        });

        /**
         * GET Server report folder content
         */
        diagnoseApp.get('/api/reportsdir', secureFnc, function (req, res) {
            var groups = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api get reportdir: Tocken Expired");
            } else {
                try {
                    var reportPath = runtime.settings.reportsDir;
                    if (!fs.existsSync(reportPath)) {
                        reportPath = path.join(process.cwd(), runtime.settings.reportsDir);
                    }
                    var reportFiles = fs.readdirSync(reportPath);
                    reportFiles = reportFiles.filter(file => file.startsWith(req.query.name + '_'));
                    res.json(reportFiles);
                } catch (err) {
                    if (err.code) {
                        res.status(400).json({ error: err.code, message: err.message });
                    } else {
                        res.status(400).json({ error: "unexpected_error", message: err.toString() });
                    }
                    runtime.logger.error("api get reportdir: " + err.message);
                }
            }
        });

        /**
         * POST testmail
         * Test SMTP send mail
         */
         diagnoseApp.post("/api/sendmail", secureFnc, function (req, res, next) {
            var groups = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api post sendmail: Tocken Expired");
            } else {
                try {
                    if (req.body.params.smtp && !req.body.params.smtp.password && runtime.settings.smtp && runtime.settings.smtp.password) {
                        req.body.params.smtp.password = runtime.settings.smtp.password;
                    }                
                    runtime.notificatorMgr.sendMail(req.body.params.msg, req.body.params.smtp).then(function() {
                        res.end();
                    }).catch(function(err) {
                        if (err.code) {
                            res.status(400).json({error:err.code, message: err.message});
                        } else {
                            res.status(400).json({error:"unexpected_error", message:err.toString()});
                        }
                        runtime.logger.error("api post sendmail: " + err.message);
                    });
                } catch (error) {
                    res.status(400).json({error:"unexpected_error", message:error.toString()});
                    runtime.logger.error("api port sendmail: " + error.message);
                }
            }
        });

        return diagnoseApp;
    }
}
