const { ethers } = require('ethers');
module.exports = {
  async createWallet(config) { return { address: ethers.Wallet.createRandom().address }; },
  async getBalance(provider, address) { return await provider.getBalance(address); },
  async sendTransaction(signer, tx) { return await signer.sendTransaction(tx); },
  async signMessage(signer, msg) { return await signer.signMessage(msg); },
};
