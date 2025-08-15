const fs = require('fs').promises;
const path = require('path');

class DatabaseService {
    constructor() {
        this.dataDir = path.join(__dirname, '../../data');
        this.claimsFile = path.join(this.dataDir, 'claims.json');
        this.statsFile = path.join(this.dataDir, 'stats.json');
        this.init();
    }

    async init() {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize files if they don't exist
            await this.initializeFiles();
        } catch (error) {
            console.error('Database initialization error:', error);
        }
    }

    async initializeFiles() {
        try {
            // Initialize claims file
            try {
                await fs.access(this.claimsFile);
            } catch {
                await fs.writeFile(this.claimsFile, JSON.stringify([], null, 2));
            }

            // Initialize stats file
            try {
                await fs.access(this.statsFile);
            } catch {
                const initialStats = {
                    totalClaims: 0,
                    totalAmountDistributed: '0',
                    lastUpdated: new Date().toISOString()
                };
                await fs.writeFile(this.statsFile, JSON.stringify(initialStats, null, 2));
            }
        } catch (error) {
            console.error('File initialization error:', error);
        }
    }

    async readClaims() {
        try {
            const data = await fs.readFile(this.claimsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Read claims error:', error);
            return [];
        }
    }

    async writeClaims(claims) {
        try {
            await fs.writeFile(this.claimsFile, JSON.stringify(claims, null, 2));
        } catch (error) {
            console.error('Write claims error:', error);
            throw new Error('Claims kaydedilemedi');
        }
    }

    async readStats() {
        try {
            const data = await fs.readFile(this.statsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Read stats error:', error);
            return {
                totalClaims: 0,
                totalAmountDistributed: '0',
                lastUpdated: new Date().toISOString()
            };
        }
    }

    async writeStats(stats) {
        try {
            await fs.writeFile(this.statsFile, JSON.stringify(stats, null, 2));
        } catch (error) {
            console.error('Write stats error:', error);
            throw new Error('Stats kaydedilemedi');
        }
    }

    async recordClaim(claimData) {
        try {
            const claims = await this.readClaims();
            
            // Add new claim
            const newClaim = {
                id: this.generateId(),
                ...claimData,
                timestamp: new Date().toISOString()
            };
            
            claims.push(newClaim);
            await this.writeClaims(claims);

            // Update stats
            await this.updateStats(claimData.amount);

            return newClaim;
        } catch (error) {
            console.error('Record claim error:', error);
            throw new Error('Claim kaydedilemedi');
        }
    }

    async getLastClaim(address) {
        try {
            const claims = await this.readClaims();
            const addressClaims = claims.filter(claim => 
                claim.address.toLowerCase() === address.toLowerCase()
            );
            
            if (addressClaims.length === 0) {
                return null;
            }

            // Sort by timestamp and get the most recent
            const sortedClaims = addressClaims.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            return {
                ...sortedClaims[0],
                timestamp: new Date(sortedClaims[0].timestamp)
            };
        } catch (error) {
            console.error('Get last claim error:', error);
            return null;
        }
    }

    async getIPClaims(ip) {
        try {
            const claims = await this.readClaims();
            return claims.filter(claim => claim.ip === ip);
        } catch (error) {
            console.error('Get IP claims error:', error);
            return [];
        }
    }

    async getRecentClaims(limit = 10) {
        try {
            const claims = await this.readClaims();
            
            // Sort by timestamp (newest first)
            const sortedClaims = claims.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            return sortedClaims.slice(0, limit).map(claim => ({
                ...claim,
                timestamp: new Date(claim.timestamp)
            }));
        } catch (error) {
            console.error('Get recent claims error:', error);
            return [];
        }
    }

    async getTotalClaims() {
        try {
            const claims = await this.readClaims();
            return claims.length;
        } catch (error) {
            console.error('Get total claims error:', error);
            return 0;
        }
    }

    async getTotalAmountDistributed() {
        try {
            const claims = await this.readClaims();
            const total = claims.reduce((sum, claim) => {
                return sum + BigInt(claim.amount);
            }, BigInt(0));
            
            return total.toString();
        } catch (error) {
            console.error('Get total amount distributed error:', error);
            return '0';
        }
    }

    async updateStats(amount) {
        try {
            const stats = await this.readStats();
            
            stats.totalClaims += 1;
            stats.totalAmountDistributed = (BigInt(stats.totalAmountDistributed) + BigInt(amount)).toString();
            stats.lastUpdated = new Date().toISOString();
            
            await this.writeStats(stats);
        } catch (error) {
            console.error('Update stats error:', error);
        }
    }

    async getStats() {
        try {
            const stats = await this.readStats();
            const totalClaims = await this.getTotalClaims();
            const totalAmount = await this.getTotalAmountDistributed();
            
            return {
                ...stats,
                totalClaims,
                totalAmountDistributed: totalAmount
            };
        } catch (error) {
            console.error('Get stats error:', error);
            return {
                totalClaims: 0,
                totalAmountDistributed: '0',
                lastUpdated: new Date().toISOString()
            };
        }
    }

    async getClaimsByAddress(address) {
        try {
            const claims = await this.readClaims();
            return claims.filter(claim => 
                claim.address.toLowerCase() === address.toLowerCase()
            ).map(claim => ({
                ...claim,
                timestamp: new Date(claim.timestamp)
            }));
        } catch (error) {
            console.error('Get claims by address error:', error);
            return [];
        }
    }

    async getClaimsByDateRange(startDate, endDate) {
        try {
            const claims = await this.readClaims();
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return claims.filter(claim => {
                const claimDate = new Date(claim.timestamp);
                return claimDate >= start && claimDate <= end;
            }).map(claim => ({
                ...claim,
                timestamp: new Date(claim.timestamp)
            }));
        } catch (error) {
            console.error('Get claims by date range error:', error);
            return [];
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Utility method to backup data
    async backup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(this.dataDir, 'backups');
            
            await fs.mkdir(backupDir, { recursive: true });
            
            const claimsBackup = path.join(backupDir, `claims-${timestamp}.json`);
            const statsBackup = path.join(backupDir, `stats-${timestamp}.json`);
            
            const claims = await this.readClaims();
            const stats = await this.readStats();
            
            await fs.writeFile(claimsBackup, JSON.stringify(claims, null, 2));
            await fs.writeFile(statsBackup, JSON.stringify(stats, null, 2));
            
            console.log(`Backup created: ${timestamp}`);
            return true;
        } catch (error) {
            console.error('Backup error:', error);
            return false;
        }
    }

    // Utility method to clean old backups
    async cleanOldBackups(daysToKeep = 7) {
        try {
            const backupDir = path.join(this.dataDir, 'backups');
            const files = await fs.readdir(backupDir);
            const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
            
            for (const file of files) {
                const filePath = path.join(backupDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    console.log(`Deleted old backup: ${file}`);
                }
            }
        } catch (error) {
            console.error('Clean old backups error:', error);
        }
    }
}

module.exports = DatabaseService;



