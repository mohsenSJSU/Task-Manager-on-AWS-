const cognitoConfig = {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    clientSecret: process.env.COGNITO_CLIENT_SECRET,
    domain: process.env.COGNITO_DOMAIN,
    region: process.env.AWS_REGION,
    redirectUri: `${process.env.APP_URL}/auth/callback`,
    logoutUri: process.env.APP_URL
};

// Generate the Cognito Hosted UI login URL
cognitoConfig.getLoginUrl = () => {
    const params = new URLSearchParams({
        client_id: cognitoConfig.clientId,
        response_type: "code",
        scope: "openid email profile",
        redirect_uri: cognitoConfig.redirectUri
    });

    // IMPORTANT: domain might include https:// in env; strip it to avoid https://https://...
    const domain = cognitoConfig.domain.replace(/^https?:\/\//, '');

    return `https://${domain}/oauth2/authorize?${params.toString()}`;
};

// Generate the logout URL
cognitoConfig.getLogoutUrl = () => {
    const domain = cognitoConfig.domain.replace(/^https?:\/\//, '');
    return `https://${domain}/logout?` +
        `client_id=${cognitoConfig.clientId}&` +
        `logout_uri=${encodeURIComponent(cognitoConfig.logoutUri)}`;
};

// Token endpoint
cognitoConfig.getTokenEndpoint = () => {
    const domain = cognitoConfig.domain.replace(/^https?:\/\//, '');
    return `https://${domain}/oauth2/token`;
};

module.exports = cognitoConfig;