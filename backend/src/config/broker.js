module.exports = {
  brokerType: 'deriv',
  deriv: {
    appId: process.env.DERIV_APP_ID,
    wsUrl: `wss://ws.binaryws.com/websockets/v3?app_id=${process.env.DERIV_APP_ID}`,
    oauthUrl: 'https://auth.deriv.com/oauth2'
  },
  supportedSymbols: ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'],
  contractTypes: ['CALL', 'PUT']
};