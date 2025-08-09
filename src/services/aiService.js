// AI Service Configuration
export class AIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_AI_API_URL || 'https://web-production-ea651.up.railway.app';
    this.statusEndpoint = '/api/ai/status';
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.isConnected = false;
    this.connectionCheckInterval = null;
  }

  async checkConnection() {
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}${this.statusEndpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add any required API keys or auth headers here
          },
          mode: 'cors', // Explicitly set CORS mode
          credentials: 'omit' // Don't send cookies for CORS requests
        });

        if (response.ok) {
          const data = await response.json();
          this.isConnected = true;
          console.log('[EALAANI AI] Connection successful:', data);
          return { success: true, data };
        } else if (response.status === 404) {
          console.warn('[EALAANI AI] Status endpoint not found. AI features may be unavailable.');
          return { success: false, error: 'Endpoint not found' };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`[EALAANI AI] Connection attempt ${attempt + 1} failed:`, error.message);
        
        // Don't retry for CORS errors
        if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
          console.error('[EALAANI AI] CORS error detected. Please configure the server to allow requests from this origin.');
          return { success: false, error: 'CORS configuration error' };
        }

        if (attempt < this.retryAttempts - 1) {
          await this.delay(this.retryDelay * (attempt + 1));
        }
      }
    }

    this.isConnected = false;
    return { success: false, error: 'Max retry attempts reached' };
  }

  startConnectionMonitoring(intervalMs = 30000) {
    // Clear any existing interval
    this.stopConnectionMonitoring();

    // Initial check
    this.checkConnection();

    // Set up periodic checks
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnection();
    }, intervalMs);
  }

  stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Placeholder methods for AI functionality
  async sendMessage(message) {
    if (!this.isConnected) {
      throw new Error('AI service is not connected');
    }
    // Implement actual message sending logic here
  }

  async getResponse(prompt) {
    if (!this.isConnected) {
      throw new Error('AI service is not connected');
    }
    // Implement actual response logic here
  }
}

// Create singleton instance
const aiService = new AIService();

// Export both the class and instance
export default aiService;