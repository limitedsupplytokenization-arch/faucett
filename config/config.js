const config = {
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development'
    },
    blockchain: {
        networkId: parseInt(process.env.NETWORK_ID) || 8453,
        rpcUrl: process.env.RPC_URL || 'https://mainnet.base.org',
        faucetAddress: process.env.FAUCET_ADDRESS || 'YOUR_FAUCET_ADDRESS_HERE',
        faucetPrivateKey: process.env.FAUCET_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE',
        tokenContractAddress: process.env.TOKEN_CONTRACT_ADDRESS || 'YOUR_LST_TOKEN_CONTRACT_ADDRESS_HERE',
        gasLimit: parseInt(process.env.GAS_LIMIT) || 21000,
        gasPrice: process.env.GAS_PRICE || 'auto'
    },
    faucet: {
        claimAmount: process.env.CLAIM_AMOUNT || '1000000000000000000', // 1 LST
        cooldownHours: parseInt(process.env.COOLDOWN_HOURS) || 1,
        maxClaimsPerIP: parseInt(process.env.MAX_CLAIMS_PER_IP) || 5,
        maxClaimsPerDay: parseInt(process.env.MAX_CLAIMS_PER_DAY) || 1000,
        minBalance: process.env.MIN_BALANCE || '100000000000000000000'
    },
    recaptcha: {
        siteKey: process.env.RECAPTCHA_SITE_KEY || 'YOUR_RECAPTCHA_SITE_KEY_HERE',
        secretKey: process.env.RECAPTCHA_SECRET_KEY || 'YOUR_RECAPTCHA_SECRET_KEY_HERE',
        version: process.env.RECAPTCHA_VERSION || 'v2',
        theme: process.env.RECAPTCHA_THEME || 'light',
        size: process.env.RECAPTCHA_SIZE || 'normal',
        minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE) || 0.5
    },
    security: {
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        trustProxy: process.env.TRUST_PROXY === 'true',
        enableCors: process.env.ENABLE_CORS !== 'false'
    },
    database: {
        type: process.env.DB_TYPE || 'file',
        backupInterval: parseInt(process.env.BACKUP_INTERVAL) || 86400000, // 24 hours
        maxBackups: parseInt(process.env.MAX_BACKUPS) || 7
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/app.log',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
    }
};

// Validation
function validateConfig() {
    const requiredFields = [
        'blockchain.faucetAddress',
        'blockchain.faucetPrivateKey',
        'blockchain.tokenContractAddress',
        'recaptcha.siteKey',
        'recaptcha.secretKey'
    ];

    const missingFields = [];

    for (const field of requiredFields) {
        const keys = field.split('.');
        let value = config;
        
        for (const key of keys) {
            value = value[key];
            if (value === undefined) break;
        }

        if (value === undefined || value === 'YOUR_' + keys[keys.length - 1].toUpperCase() + '_HERE') {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        console.warn('⚠️  Missing or default configuration values:');
        missingFields.forEach(field => {
            console.warn(`   - ${field}`);
        });
        console.warn('Please update your configuration before running in production.');
    }

    return missingFields.length === 0;
}

// Export config and validation
module.exports = config;
module.exports.validate = validateConfig;
