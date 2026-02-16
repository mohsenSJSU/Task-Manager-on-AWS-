const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const cognitoConfig = require('../config/cognito');

// JWKS client to get Cognito public keys
const client = jwksClient({
    jwksUri: `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}/.well-known/jwks.json`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
        } else {
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
        }
    });
}

// Verify JWT token
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {
            algorithms: ['RS256'],
            issuer: `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`
        }, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
        });
    });
};

// Middleware: Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/');
};

// Middleware: Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    }
    res.status(403).render('error', { message: 'Access denied. Admin only.' });
};

module.exports = { verifyToken, isAuthenticated, isAdmin };