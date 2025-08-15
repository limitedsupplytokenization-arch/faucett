class LSTFaucet {
    constructor() {
        this.apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000/api'
            : '/api';
        this.countdownInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkCountdown();
        this.loadStoredAddress();
    }

    bindEvents() {
        const form = document.getElementById('faucetForm');
        const addressInput = document.getElementById('ethAddress');
        const claimButton = document.getElementById('claimButton');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        addressInput.addEventListener('input', (e) => this.validateAddress(e.target.value));
        
        // Auto-format address input
        addressInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.formatAddress(e.target);
            }, 100);
        });
    }

    validateAddress(address) {
        const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
        const input = document.getElementById('ethAddress');
        
        if (address.length > 0) {
            if (isValid) {
                input.style.borderColor = '#00b894';
                input.style.boxShadow = '0 0 0 3px rgba(0, 184, 148, 0.1)';
            } else {
                input.style.borderColor = '#ff6b6b';
                input.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
            }
        } else {
            input.style.borderColor = '#e1e5e9';
            input.style.boxShadow = 'none';
        }
        
        return isValid;
    }

    formatAddress(input) {
        let value = input.value.replace(/[^a-fA-F0-9]/g, '');
        if (value.length > 0 && !value.startsWith('0x')) {
            value = '0x' + value;
        }
        input.value = value;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const addressInput = document.getElementById('ethAddress');
        const address = addressInput.value.trim();
        const recaptchaResponse = grecaptcha.getResponse();
        
        // Validation
        if (!this.validateAddress(address)) {
            this.showStatus('Please enter a valid ETH address.', 'error');
            return;
        }
        
        if (!recaptchaResponse) {
            this.showStatus('Please complete the reCAPTCHA verification.', 'error');
            return;
        }
        
        // Check if user can claim
        const canClaim = await this.checkClaimEligibility(address);
        if (!canClaim.eligible) {
            this.showStatus(canClaim.message, 'error');
            this.startCountdown(canClaim.nextClaimTime);
            return;
        }
        
        // Submit claim
        await this.submitClaim(address, recaptchaResponse);
    }

    async checkClaimEligibility(address) {
        try {
            const response = await fetch(`${this.apiUrl}/check-eligibility`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Eligibility check error:', error);
            return { eligible: false, message: 'Server error. Please try again.' };
        }
    }

    async submitClaim(address, recaptchaResponse) {
        const claimButton = document.getElementById('claimButton');
        const originalText = claimButton.innerHTML;
        
        try {
            // Show loading state
            claimButton.disabled = true;
            claimButton.classList.add('loading');
            claimButton.innerHTML = '<span class="btn-text">Processing...</span>';
            
            const response = await fetch(`${this.apiUrl}/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address,
                    recaptchaResponse
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showStatus(`🎉 Success! ${data.amount} LST sent to your address.`, 'success');
                this.startCountdown(data.nextClaimTime);
                this.saveAddress(address);
                
                // Reset form
                document.getElementById('faucetForm').reset();
                grecaptcha.reset();
            } else {
                this.showStatus(data.message || 'An error occurred. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Claim error:', error);
            this.showStatus('Connection error. Please try again.', 'error');
        } finally {
            // Reset button state
            claimButton.disabled = false;
            claimButton.classList.remove('loading');
            claimButton.innerHTML = originalText;
        }
    }

    startCountdown(nextClaimTime) {
        const countdownElement = document.getElementById('countdown');
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        countdownElement.classList.remove('hidden');
        
        const updateCountdown = () => {
            const now = new Date().getTime();
            const targetTime = new Date(nextClaimTime).getTime();
            const timeLeft = targetTime - now;
            
            if (timeLeft <= 0) {
                countdownElement.classList.add('hidden');
                this.showStatus('You can claim LST again!', 'info');
                clearInterval(this.countdownInterval);
                return;
            }
            
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');
        };
        
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 1000);
    }

    checkCountdown() {
        const storedTime = localStorage.getItem('lst_nextClaimTime');
        if (storedTime) {
            const nextClaimTime = new Date(storedTime);
            const now = new Date();
            
            if (nextClaimTime > now) {
                this.startCountdown(nextClaimTime);
            } else {
                localStorage.removeItem('lst_nextClaimTime');
            }
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        statusElement.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 5000);
    }

    saveAddress(address) {
        localStorage.setItem('lst_lastAddress', address);
    }

    loadStoredAddress() {
        const storedAddress = localStorage.getItem('lst_lastAddress');
        if (storedAddress) {
            document.getElementById('ethAddress').value = storedAddress;
        }
    }

    // Utility function to format numbers
    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LSTFaucet();
});

// Add some fun animations
document.addEventListener('DOMContentLoaded', () => {
    // Add floating particles effect
    createFloatingParticles();
    
    // Add click ripple effect
    document.addEventListener('click', createRipple);
});

function createFloatingParticles() {
    const particles = 20;
    const container = document.body;
    
    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
            animation: float-particle ${5 + Math.random() * 10}s linear infinite;
        `;
        container.appendChild(particle);
    }
}

function createRipple(event) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${event.clientX - 10}px;
        top: ${event.clientY - 10}px;
        animation: ripple-effect 0.6s ease-out;
    `;
    document.body.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes float-particle {
        0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes ripple-effect {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
