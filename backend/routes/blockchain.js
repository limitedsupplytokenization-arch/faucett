const express = require('express');
const router = express.Router();

// Import services
const BlockchainService = require('../services/blockchainService');

// Initialize service
const blockchainService = new BlockchainService();

// Get blockchain info
router.get('/info', async (req, res) => {
    try {
        const info = await blockchainService.getBlockchainInfo();
        res.json(info);
    } catch (error) {
        console.error('Blockchain info error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'Blockchain bilgileri alınırken bir hata oluştu'
        });
    }
});

// Get faucet balance
router.get('/balance', async (req, res) => {
    try {
        const balance = await blockchainService.getFaucetBalance();
        res.json({
            balance: balance.toString(),
            formatted: blockchainService.formatBalance(balance)
        });
    } catch (error) {
        console.error('Balance error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'Bakiye bilgisi alınırken bir hata oluştu'
        });
    }
});

// Get transaction status
router.get('/tx/:txHash', async (req, res) => {
    try {
        const { txHash } = req.params;
        const status = await blockchainService.getTransactionStatus(txHash);
        res.json(status);
    } catch (error) {
        console.error('Transaction status error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'İşlem durumu alınırken bir hata oluştu'
        });
    }
});

// Get gas price
router.get('/gas-price', async (req, res) => {
    try {
        const gasPrice = await blockchainService.getGasPrice();
        res.json({
            gasPrice: gasPrice.toString(),
            formatted: blockchainService.formatGasPrice(gasPrice)
        });
    } catch (error) {
        console.error('Gas price error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'Gas fiyatı alınırken bir hata oluştu'
        });
    }
});

// Get network status
router.get('/network-status', async (req, res) => {
    try {
        const status = await blockchainService.getNetworkStatus();
        res.json(status);
    } catch (error) {
        console.error('Network status error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'Ağ durumu alınırken bir hata oluştu'
        });
    }
});

module.exports = router;



