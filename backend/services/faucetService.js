const BlockchainService = require('./blockchainService');
const DatabaseService = require('./databaseService');
const config = require('../../config/config');

class FaucetService {
    constructor() {
        this.blockchainService = new BlockchainService();
        this.databaseService = new DatabaseService();
        this.claimAmount = config.faucet.claimAmount || '10000000000000000000'; // 10 LST (18 decimals)
        this.cooldownHours = config.faucet.cooldownHours || 1;
    }

    async checkEligibility(address, clientIP) {
        try {
            // Check if address is valid
            if (!this.isValidAddress(address)) {
                return {
                    eligible: false,
                    message: 'Geçersiz ETH adresi'
                };
            }

            // Check if faucet has enough balance
            const faucetBalance = await this.blockchainService.getFaucetBalance();
            if (faucetBalance.lt(this.claimAmount)) {
                return {
                    eligible: false,
                    message: 'Musluk bakiyesi yetersiz. Lütfen daha sonra tekrar deneyin.'
                };
            }

            // Check cooldown period
            const lastClaim = await this.databaseService.getLastClaim(address);
            if (lastClaim) {
                const now = new Date();
                const timeSinceLastClaim = now - lastClaim.timestamp;
                const cooldownMs = this.cooldownHours * 60 * 60 * 1000;

                if (timeSinceLastClaim < cooldownMs) {
                    const nextClaimTime = new Date(lastClaim.timestamp.getTime() + cooldownMs);
                    const remainingTime = cooldownMs - timeSinceLastClaim;
                    const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
                    const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

                    return {
                        eligible: false,
                        message: `Son claim'den bu yana ${this.cooldownHours} saat geçmedi. Kalan süre: ${remainingHours}s ${remainingMinutes}d`,
                        nextClaimTime: nextClaimTime.toISOString()
                    };
                }
            }

            // Check IP rate limiting
            const ipClaims = await this.databaseService.getIPClaims(clientIP);
            const maxClaimsPerIP = config.faucet.maxClaimsPerIP || 5;
            const timeWindow = 24 * 60 * 60 * 1000; // 24 hours

            const recentIPClaims = ipClaims.filter(claim => {
                const now = new Date();
                return (now - claim.timestamp) < timeWindow;
            });

            if (recentIPClaims.length >= maxClaimsPerIP) {
                return {
                    eligible: false,
                    message: `Bu IP adresinden günlük maksimum ${maxClaimsPerIP} claim yapabilirsiniz.`
                };
            }

            return {
                eligible: true,
                message: 'Claim yapabilirsiniz',
                amount: this.formatAmount(this.claimAmount)
            };

        } catch (error) {
            console.error('Check eligibility error:', error);
            throw new Error('Eligibility kontrolü sırasında bir hata oluştu');
        }
    }

    async processClaim(address, clientIP) {
        try {
            // Double-check eligibility
            const eligibility = await this.checkEligibility(address, clientIP);
            if (!eligibility.eligible) {
                return {
                    success: false,
                    message: eligibility.message
                };
            }

            // Send tokens
            const txResult = await this.blockchainService.sendTokens(address, this.claimAmount);
            
            if (txResult.success) {
                // Record the claim
                await this.databaseService.recordClaim({
                    address: address.toLowerCase(),
                    ip: clientIP,
                    amount: this.claimAmount,
                    txHash: txResult.txHash,
                    timestamp: new Date()
                });

                // Calculate next claim time
                const nextClaimTime = new Date(Date.now() + (this.cooldownHours * 60 * 60 * 1000));

                return {
                    success: true,
                    message: 'LST başarıyla gönderildi!',
                    amount: this.formatAmount(this.claimAmount),
                    txHash: txResult.txHash,
                    nextClaimTime: nextClaimTime.toISOString()
                };
            } else {
                return {
                    success: false,
                    message: txResult.message || 'Token gönderimi başarısız'
                };
            }

        } catch (error) {
            console.error('Process claim error:', error);
            return {
                success: false,
                message: 'Claim işlemi sırasında bir hata oluştu'
            };
        }
    }

    async getStats() {
        try {
            const totalClaims = await this.databaseService.getTotalClaims();
            const totalAmount = await this.databaseService.getTotalAmountDistributed();
            const faucetBalance = await this.blockchainService.getFaucetBalance();
            const recentClaims = await this.databaseService.getRecentClaims(5);

            return {
                totalClaims,
                totalAmountDistributed: this.formatAmount(totalAmount),
                faucetBalance: this.formatAmount(faucetBalance.toString()),
                claimAmount: this.formatAmount(this.claimAmount),
                cooldownHours: this.cooldownHours,
                recentClaims: recentClaims.map(claim => ({
                    address: claim.address,
                    amount: this.formatAmount(claim.amount),
                    timestamp: claim.timestamp,
                    txHash: claim.txHash
                }))
            };
        } catch (error) {
            console.error('Get stats error:', error);
            throw new Error('İstatistikler alınırken bir hata oluştu');
        }
    }

    async getRecentClaims(limit = 10) {
        try {
            const claims = await this.databaseService.getRecentClaims(limit);
            return claims.map(claim => ({
                address: claim.address,
                amount: this.formatAmount(claim.amount),
                timestamp: claim.timestamp,
                txHash: claim.txHash
            }));
        } catch (error) {
            console.error('Get recent claims error:', error);
            throw new Error('Son claim\'ler alınırken bir hata oluştu');
        }
    }

    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    formatAmount(amount) {
        // Convert from wei to LST (assuming 18 decimals)
        const wei = BigInt(amount);
        const lst = Number(wei) / Math.pow(10, 18);
        return lst.toLocaleString('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
}

module.exports = FaucetService;



