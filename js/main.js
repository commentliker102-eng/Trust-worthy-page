// js/main.js
class TrustVerifier {
    constructor() {
        this.accountId = '640846f3750d7515889506062e8fbdbf';
        this.bucketName = 'discord-ip-data';
        this.s3Url = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}`;
        this.init();
    }

    init() {
        const verifyButton = document.getElementById('verifyButton');
        if (verifyButton) {
            verifyButton.addEventListener('click', () => this.verifyTrust());
        }
    }

    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error getting IP:', error);
            return 'Unknown IP';
        }
    }

    async storeTrustData(discordName, ipAddress, timestamp, trustScore) {
        try {
            const filename = `trust_${discordName}_${Date.now()}.json`;
            
            const data = {
                discordName,
                ipAddress,
                timestamp,
                trustScore,
                userAgent: navigator.userAgent,
                verificationType: 'trustworthy'
            };
            
            // Store in R2
            const response = await fetch(`${this.s3Url}/${filename}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                return { success: true, filename };
            } else {
                throw new Error(`Storage failed: ${response.status}`);
            }
        } catch (error) {
            console.error('R2 Storage Error:', error);
            // Fallback to localStorage
            this.storeInLocalStorage(data);
            return { success: false, error: error.message };
        }
    }

    storeInLocalStorage(data) {
        const stored = JSON.parse(localStorage.getItem('trustData') || '[]');
        stored.push(data);
        localStorage.setItem('trustData', JSON.stringify(stored));
    }

    async verifyTrust() {
        const discordName = this.getDiscordUsername();
        const ipAddress = await this.getIPAddress();
        const timestamp = new Date().toISOString();
        
        // Simulate trust score calculation
        const trustScore = Math.floor(Math.random() * 100) + 1;
        
        try {
            const result = await this.storeTrustData(discordName, ipAddress, timestamp, trustScore);
            
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = `
                <h3>Verification Complete</h3>
                <p><strong>User:</strong> ${discordName}</p>
                <p><strong>IP Address:</strong> ${ipAddress}</p>
                <p><strong>Trust Score:</strong> ${trustScore}/100</p>
                <p><strong>Status:</strong> ${result.success ? 'Stored in Cloudflare R2' : 'Stored locally'}</p>
            `;
            
        } catch (error) {
            console.error('Verification failed:', error);
            alert('Verification failed. Please try again.');
        }
    }

    getDiscordUsername() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('discord') || 'Anonymous';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TrustVerifier();
});
