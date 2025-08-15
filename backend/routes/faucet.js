const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Import services
const FaucetService = require('../services/faucetService');
const RecaptchaService = require('../services/recaptchaService');
const DatabaseService = require('../services/databaseService');

// Initialize services
const faucetService = new FaucetService();
const recaptchaService = new RecaptchaService();
const databaseService = new DatabaseService();

// Validation middleware
const validateAddress = [
    body('address')
        .trim()
        .isLength({ min: 42, max: 42 })
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Geçerli bir ETH adresi girin (0x ile başlayan 42 karakter)'),
];

const validateRecaptcha = [
    body('recaptchaResponse')
        .notEmpty()
        .withMessage('reCAPTCHA doğrulaması gerekli'),
];

// Check eligibility endpoint
router.post('/check-eligibility', validateAddress, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation error',
                details: errors.array()
            });
        }

        const { address } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress;

        // Check if address is eligible for claiming
        const eligibility = await faucetService.checkEligibility(address, clientIP);

        res.json(eligibility);
    } catch (error) {
        console.error('Check eligibility error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'Eligibility kontrolü sırasında bir hata oluştu'
        });
    }
});

// Claim endpoint
router.post('/claim', [...validateAddress, ...validateRecaptcha], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation error',
                details: errors.array()
            });
        }

        const { address, recaptchaResponse } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress;

        // Verify reCAPTCHA
        const recaptchaValid = await recaptchaService.verify(recaptchaResponse, clientIP);
        if (!recaptchaValid) {
            return res.status(400).json({
                error: 'reCAPTCHA doğrulaması başarısız',
                message: 'Lütfen reCAPTCHA doğrulamasını tekrar tamamlayın'
            });
        }

        // Check eligibility again (in case of race conditions)
        const eligibility = await faucetService.checkEligibility(address, clientIP);
        if (!eligibility.eligible) {
            return res.status(400).json({
                error: 'Claim uygun değil',
                message: eligibility.message,
                nextClaimTime: eligibility.nextClaimTime
            });
        }

        // Process the claim
        const claimResult = await faucetService.processClaim(address, clientIP);

        if (claimResult.success) {
            res.json({
                success: true,
                message: 'LST başarıyla gönderildi!',
                amount: claimResult.amount,
                txHash: claimResult.txHash,
                nextClaimTime: claimResult.nextClaimTime
            });
        } else {
            res.status(400).json({
                error: 'Claim işlemi başarısız',
                message: claimResult.message
            });
        }
    } catch (error) {
        console.error('Claim error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'Claim işlemi sırasında bir hata oluştu'
        });
    }
});

// Get faucet statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await faucetService.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'İstatistikler alınırken bir hata oluştu'
        });
    }
});

// Get recent claims
router.get('/recent-claims', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const claims = await faucetService.getRecentClaims(limit);
        res.json(claims);
    } catch (error) {
        console.error('Recent claims error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: 'Son claim\'ler alınırken bir hata oluştu'
        });
    }
});

module.exports = router;



