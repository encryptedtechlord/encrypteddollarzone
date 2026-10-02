const axios = require('axios');
const crypto = require('crypto');

class DerivAuthService {
  constructor() {
    this.clientId = process.env.DERIV_CLIENT_ID;
    this.clientSecret = process.env.DERIV_CLIENT_SECRET;
    this.redirectUri = process.env.DERIV_REDIRECT_URI;
    this.authUrl = 'https://auth.deriv.com/oauth2/auth';
    this.tokenUrl = 'https://auth.deriv.com/oauth2/token';
  }

  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  getAuthorizationUrl(state, codeChallenge) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'trade account_manage read',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code, codeVerifier) {
    const response = await axios.post(this.tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return response.data;
  }

  async refreshAccessToken(refreshToken) {
    const response = await axios.post(this.tokenUrl,
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return response.data;
  }
}

module.exports = new DerivAuthService();