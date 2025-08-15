const https = require('https');
const querystring = require('querystring');
const config = require('../../config/config');

class RecaptchaService {
    constructor() {
        this.secretKey = config.recaptcha.secretKey;
        this.verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    }

    async verify(recaptchaResponse, clientIP) {
        try {
            if (!recaptchaResponse) {
                return false;
            }

            const postData = querystring.stringify({
                secret: this.secretKey,
                response: recaptchaResponse,
                remoteip: clientIP
            });

            const options = {
                hostname: 'www.google.com',
                port: 443,
                path: '/recaptcha/api/siteverify',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            return new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            
                            if (result.success) {
                                // Additional checks for score (if using reCAPTCHA v3)
                                if (result.score !== undefined) {
                                    const minScore = config.recaptcha.minScore || 0.5;
                                    if (result.score < minScore) {
                                        console.log(`reCAPTCHA score too low: ${result.score}`);
                                        resolve(false);
                                        return;
                                    }
                                }
                                
                                resolve(true);
                            } else {
                                console.log('reCAPTCHA verification failed:', result['error-codes']);
                                resolve(false);
                            }
                        } catch (error) {
                            console.error('reCAPTCHA response parsing error:', error);
                            resolve(false);
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error('reCAPTCHA request error:', error);
                    resolve(false);
                });

                req.write(postData);
                req.end();
            });

        } catch (error) {
            console.error('reCAPTCHA verification error:', error);
            return false;
        }
    }

    // Alternative method using fetch (if available)
    async verifyWithFetch(recaptchaResponse, clientIP) {
        try {
            if (!recaptchaResponse) {
                return false;
            }

            const formData = new URLSearchParams();
            formData.append('secret', this.secretKey);
            formData.append('response', recaptchaResponse);
            formData.append('remoteip', clientIP);

            const response = await fetch(this.verifyUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const result = await response.json();

            if (result.success) {
                // Additional checks for score (if using reCAPTCHA v3)
                if (result.score !== undefined) {
                    const minScore = config.recaptcha.minScore || 0.5;
                    if (result.score < minScore) {
                        console.log(`reCAPTCHA score too low: ${result.score}`);
                        return false;
                    }
                }
                
                return true;
            } else {
                console.log('reCAPTCHA verification failed:', result['error-codes']);
                return false;
            }

        } catch (error) {
            console.error('reCAPTCHA verification error:', error);
            return false;
        }
    }

    // Method to get reCAPTCHA site key for frontend
    getSiteKey() {
        return config.recaptcha.siteKey;
    }

    // Method to check if reCAPTCHA is configured
    isConfigured() {
        return !!(this.secretKey && config.recaptcha.siteKey);
    }

    // Method to get reCAPTCHA configuration for frontend
    getConfig() {
        return {
            siteKey: config.recaptcha.siteKey,
            version: config.recaptcha.version || 'v2',
            theme: config.recaptcha.theme || 'light',
            size: config.recaptcha.size || 'normal'
        };
    }
}

module.exports = RecaptchaService;



