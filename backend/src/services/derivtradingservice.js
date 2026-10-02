const WebSocket = require('ws');

class DerivTradingService {
  constructor() {
    this.ws = null;
    this.appId = process.env.DERIV_APP_ID;
    this.wsUrl = `wss://ws.binaryws.com/websockets/v3?app_id=${this.appId}`;
    this.isConnected = false;
  }

  async connect(accessToken) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.on('open', () => {
        this.ws.send(JSON.stringify({ authorize: accessToken, req_id: Date.now() }));
      });

      this.ws.on('message', (data) => {
        const response = JSON.parse(data);
        if (response.error) reject(new Error(response.error.message));
        if (response.authorize) {
          this.isConnected = true;
          console.log('✅ Deriv WebSocket connected');
          resolve(this.ws);
        }
      });

      this.ws.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
  }

  async getBalance() {
    return new Promise((resolve, reject) => {
      const reqId = Date.now();
      this.ws.send(JSON.stringify({ balance: 1, req_id: reqId }));

      const handler = (data) => {
        const response = JSON.parse(data);
        if (response.req_id === reqId) {
          if (response.error) reject(response.error);
          resolve({
            loginid: response.balance.loginid,
            currency: response.balance.currency,
            balance: response.balance.balance,
            demo: response.balance.demo
          });
          this.ws.removeListener('message', handler);
        }
      };
      this.ws.on('message', handler);
    });
  }

  async getProposal(symbol, amount, duration, contractType) {
    return new Promise((resolve, reject) => {
      const reqId = Date.now();
      this.ws.send(JSON.stringify({
        proposal: 1,
        amount: amount,
        basis: 'stake',
        contract_type: contractType,
        currency: 'USD',
        duration: duration,
        duration_unit: 't',
        symbol: symbol,
        req_id: reqId
      }));

      const handler = (data) => {
        const response = JSON.parse(data);
        if (response.req_id === reqId) {
          if (response.error) reject(new Error(response.error.message));
          if (response.proposal) {
            resolve({
              id: response.proposal.id,
              askPrice: response.proposal.ask_price,
              spot: response.proposal.spot
            });
          }
          this.ws.removeListener('message', handler);
        }
      };
      this.ws.on('message', handler);
    });
  }

  async buyContract(proposalId, price) {
    return new Promise((resolve, reject) => {
      const reqId = Date.now();
      this.ws.send(JSON.stringify({ buy: proposalId, price: price, req_id: reqId }));

      const handler = (data) => {
        const response = JSON.parse(data);
        if (response.req_id === reqId) {
          if (response.error) reject(new Error(response.error.message));
          if (response.buy) {
            resolve({
              contractId: response.buy.contract_id,
              transactionId: response.buy.transaction_id,
              buyPrice: response.buy.buy_price
            });
          }
          this.ws.removeListener('message', handler);
        }
      };
      this.ws.on('message', handler);
    });
  }

  async getContractResult(contractId) {
    return new Promise((resolve, reject) => {
      const reqId = Date.now();
      this.ws.send(JSON.stringify({ portfolio: 1, contract: contractId, req_id: reqId }));

      const handler = (data) => {
        const response = JSON.parse(data);
        if (response.req_id === reqId) {
          if (response.error) reject(new Error(response.error.message));
          if (response.portfolio?.contracts) {
            const contract = response.portfolio.contracts.find(c => c.contract_id === contractId);
            resolve(contract);
          } else resolve(null);
          this.ws.removeListener('message', handler);
        }
      };
      this.ws.on('message', handler);
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }
}

module.exports = new DerivTradingService();