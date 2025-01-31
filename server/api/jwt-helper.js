'use strict';

const jwt = require('jsonwebtoken');

var secretCode = 'frangoteam751';
var tokenExpiresIn = 60 * 15;   // 15 minutes
const adminGroups = [-1, 255];


function init(_secretCode, _tokenExpires) {
    if (_secretCode) {
        secretCode = _secretCode;
    }
    if (_tokenExpires) {
        tokenExpiresIn = _tokenExpires;
    }
}

function verifyToken (req, res, next) {
    let token = null;
    if (req.cookies) {
        token =  req.cookies['token'];
    }
    if (token) {
        jwt.verify(token, secretCode, (err, decoded) => {
            if (err) {
                req.userId = null;
                req.userName = null;
                req.userGroups = null;
                if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
                    req.tokenExpired = true;
                    res.status(403).json({error:"unauthorized_error", message: "Token Expired!"});
                }
                next();
                // return res.status(500).send({
                //     auth: false,
                //     message: 'Fail to Authentication. Error -> ' + err
                // });
            } else {
                if (decoded.user) {
                    req.userId = decoded.user.id;
                    req.userName = decoded.user.name;
                    req.userGroups = getUserGroups(decoded.user.role);
                    if (!req.userGroups) {
                        res.status(403).json({ error: "unauthorized_error", message: "User Profile Corrupted!" });
                    }
                }
                next();
            }
        });
    } else {
        // notice that no token was provided...}
        req.userId = null;
        req.userGroups = null;
        next();
    }
}

function getUserGroups(role) {
    if (role.permission) {
        if (role.permission.indexOf('DASHBOARD_SCADA_EDITOR') !== -1) {
            return 255;
        } else if (role.permission.indexOf('DASHBOARD_SCADA_VIEWER') !== -1) {
            return 1;
        }
    }
    return 0;
}

function getTokenExpiresIn() {
    return tokenExpiresIn;
}

module.exports = {
    init: init,
    verifyToken: verifyToken,
    get secretCode() { return secretCode },
    get tokenExpiresIn() { return tokenExpiresIn },
    adminGroups: adminGroups
};
