let Web3Ctor;
try {
	({ Web3: Web3Ctor } = require('web3'));
	if (!Web3Ctor) {
		Web3Ctor = require('web3');
	}
} catch (e) {
	Web3Ctor = require('web3');
}
const config = require('../../config/config');

class BlockchainService {
    constructor() {
        this.web3 = new Web3Ctor(config.blockchain.rpcUrl);
        this.faucetAddress = config.blockchain.faucetAddress;
        this.faucetPrivateKey = config.blockchain.faucetPrivateKey;
        this.tokenContractAddress = config.blockchain.tokenContractAddress;
        this.tokenContract = null;
        
        this.initContract();
    }

    initContract() {
        try {
            // ERC-20 Token ABI (minimal)
            const tokenABI = [
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "_to",
                            "type": "address"
                        },
                        {
                            "name": "_value",
                            "type": "uint256"
                        }
                    ],
                    "name": "transfer",
                    "outputs": [
                        {
                            "name": "",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [
                        {
                            "name": "_owner",
                            "type": "address"
                        }
                    ],
                    "name": "balanceOf",
                    "outputs": [
                        {
                            "name": "balance",
                            "type": "uint256"
                        }
                    ],
                    "payable": false,
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint8"
                        }
                    ],
                    "payable": false,
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "symbol",
                    "outputs": [
                        {
                            "name": "",
                            "type": "string"
                        }
                    ],
                    "payable": false,
                    "stateMutability": "view",
                    "type": "function"
                }
            ];

            this.tokenContract = new this.web3.eth.Contract(tokenABI, this.tokenContractAddress);
        } catch (error) {
            console.error('Contract initialization error:', error);
            throw new Error('Token contract başlatılamadı');
        }
    }

    async getBlockchainInfo() {
        try {
            const [blockNumber, gasPrice, networkId] = await Promise.all([
                this.web3.eth.getBlockNumber(),
                this.web3.eth.getGasPrice(),
                this.web3.eth.net.getId()
            ]);

            return {
                networkId,
                blockNumber,
                gasPrice: this.formatGasPrice(gasPrice),
                rpcUrl: config.blockchain.rpcUrl,
                chainName: this.getChainName(networkId)
            };
        } catch (error) {
            console.error('Get blockchain info error:', error);
            throw new Error('Blockchain bilgileri alınamadı');
        }
    }

    async getFaucetBalance() {
        try {
            const balance = await this.tokenContract.methods.balanceOf(this.faucetAddress).call();
            return this.web3.utils.toBN(balance);
        } catch (error) {
            console.error('Get faucet balance error:', error);
            throw new Error('Faucet bakiyesi alınamadı');
        }
    }

    async sendTokens(toAddress, amount) {
        try {
            // Validate address
            if (!this.web3.utils.isAddress(toAddress)) {
                return {
                    success: false,
                    message: 'Geçersiz hedef adres'
                };
            }

            // Check faucet balance
            const faucetBalance = await this.getFaucetBalance();
            const transferAmount = this.web3.utils.toBN(amount);
            
            if (faucetBalance.lt(transferAmount)) {
                return {
                    success: false,
                    message: 'Faucet bakiyesi yetersiz'
                };
            }

            // Get gas price
            const gasPrice = await this.web3.eth.getGasPrice();
            
            // Estimate gas
            const gasEstimate = await this.tokenContract.methods
                .transfer(toAddress, amount)
                .estimateGas({ from: this.faucetAddress });

            // Create transaction
            const tx = {
                from: this.faucetAddress,
                to: this.tokenContractAddress,
                gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
                gasPrice: gasPrice,
                data: this.tokenContract.methods.transfer(toAddress, amount).encodeABI()
            };

            // Sign and send transaction
            const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.faucetPrivateKey);
            const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

            if (receipt.status) {
                return {
                    success: true,
                    txHash: receipt.transactionHash,
                    gasUsed: receipt.gasUsed,
                    blockNumber: receipt.blockNumber
                };
            } else {
                return {
                    success: false,
                    message: 'İşlem başarısız oldu'
                };
            }

        } catch (error) {
            console.error('Send tokens error:', error);
            return {
                success: false,
                message: error.message || 'Token gönderimi sırasında hata oluştu'
            };
        }
    }

    async getTransactionStatus(txHash) {
        try {
            const receipt = await this.web3.eth.getTransactionReceipt(txHash);
            
            if (!receipt) {
                return {
                    status: 'pending',
                    message: 'İşlem bekleniyor'
                };
            }

            if (receipt.status) {
                return {
                    status: 'confirmed',
                    message: 'İşlem onaylandı',
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed
                };
            } else {
                return {
                    status: 'failed',
                    message: 'İşlem başarısız'
                };
            }
        } catch (error) {
            console.error('Get transaction status error:', error);
            throw new Error('İşlem durumu alınamadı');
        }
    }

    async getGasPrice() {
        try {
            const gasPrice = await this.web3.eth.getGasPrice();
            return gasPrice;
        } catch (error) {
            console.error('Get gas price error:', error);
            throw new Error('Gas fiyatı alınamadı');
        }
    }

    async getNetworkStatus() {
        try {
            const [blockNumber, gasPrice, peerCount] = await Promise.all([
                this.web3.eth.getBlockNumber(),
                this.web3.eth.getGasPrice(),
                this.web3.eth.net.getPeerCount()
            ]);

            return {
                isConnected: true,
                blockNumber,
                gasPrice: this.formatGasPrice(gasPrice),
                peerCount,
                networkId: await this.web3.eth.net.getId()
            };
        } catch (error) {
            console.error('Get network status error:', error);
            return {
                isConnected: false,
                error: error.message
            };
        }
    }

    formatBalance(balance) {
        const wei = this.web3.utils.toBN(balance);
        const eth = this.web3.utils.fromWei(wei, 'ether');
        return parseFloat(eth).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        });
    }

    formatGasPrice(gasPrice) {
        const gwei = this.web3.utils.fromWei(gasPrice, 'gwei');
        return parseFloat(gwei).toFixed(2) + ' Gwei';
    }

    getChainName(networkId) {
        const networks = {
            1: 'Ethereum Mainnet',
            8453: 'Base Mainnet',
            84531: 'Base Goerli Testnet',
            84532: 'Base Sepolia Testnet',
            11155111: 'Sepolia Testnet',
            5: 'Goerli Testnet'
        };
        return networks[networkId] || `Unknown Network (${networkId})`;
    }

    // Utility method to check if connected to correct network
    async checkNetwork() {
        try {
            const networkId = await this.web3.eth.net.getId();
            const expectedNetworkId = config.blockchain.networkId;
            
            if (networkId !== expectedNetworkId) {
                throw new Error(`Yanlış ağ. Beklenen: ${expectedNetworkId}, Mevcut: ${networkId}`);
            }
            
            return true;
        } catch (error) {
            console.error('Network check error:', error);
            throw error;
        }
    }
}

module.exports = BlockchainService;



