const express = require('express');
const router = express.Router();
const cognitoConfig = require('../config/cognito');
const { verifyToken } = require('../middleware/auth');

// Redirect to Cognito Hosted UI
router.get('/login', (req, res) => {
    const url = cognitoConfig.getLoginUrl();
    console.log("LOGIN URL =", url);
    res.redirect(url);
});

// Handle callback from Cognito
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.redirect('/?error=no_code');
    }
    
    try {
        // Exchange code for tokens
        const tokenResponse = await fetch(cognitoConfig.getTokenEndpoint(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    `${cognitoConfig.clientId}:${cognitoConfig.clientSecret}`
                ).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: cognitoConfig.clientId,
                redirect_uri: cognitoConfig.redirectUri,
                code: code
            })
        });
        
        const tokens = await tokenResponse.json();
        
        if (tokens.error) {
            console.error('Token error:', tokens);
            return res.redirect('/?error=token_error');
        }
        
        // Verify and decode the ID token
        const decoded = await verifyToken(tokens.id_token);
        
        // Check if user is in Admins group
        const groups = decoded['cognito:groups'] || [];
        const isAdmin = groups.includes('Admins');
        
        // Store user info in session
        req.session.user = {
            id: decoded.sub,
            email: decoded.email,
            groups: groups,
            isAdmin: isAdmin
        };
        req.session.tokens = tokens;
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Auth error:', error);
        res.redirect('/?error=auth_failed');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect(cognitoConfig.getLogoutUrl());
    });
});

module.exports = router;