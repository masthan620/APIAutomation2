// sendScreenshotToCliq.js
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import qs from 'qs';
import 'dotenv/config';
import { red, green, yellow, reset } from './utils/apiClient.js';

class ScreenshotUploader {
    constructor(options = {}) {
        this.options = {
            channelName: options.channelName || 'automationreports',
            filePath: options.filePath || './summary/summary.png',
            clientId: process.env.ZOHO_CLIENT_ID,
            clientSecret: process.env.ZOHO_CLIENT_SECRET,
            refreshToken: process.env.ZOHO_REFRESH_TOKEN ,
            redirectUri: process.env.ZOHO_REDIRECT_URI,
            companyId: process.env.ZOHO_COMPANY_ID,
            cliqBaseUrl: process.env.ZOHO_CLIQ_BASE_URL
        };

        // Validate environment variables
        this.validateCredentials();
    }

    /**
     * Validates that all required credentials are present
     */
    validateCredentials() {
        const missing = [];
        if (!this.options.clientId) missing.push('ZOHO_CLIENT_ID');
        if (!this.options.clientSecret) missing.push('ZOHO_CLIENT_SECRET');
        if (!this.options.refreshToken) missing.push('ZOHO_REFRESH_TOKEN');

        if (missing.length > 0) {
            console.error('❌ Missing environment variables:', missing.join(', '));
            console.error('Please set these environment variables before running the script.');
            process.exit(1);
        }

        console.log(`${yellow}✅ All required environment variables are present`);
    }

    /**
     * Gets Zoho OAuth token
     */
    async getToken() {
        try {
            console.log(`${yellow}🔑 Requesting new OAuth token...`);
            
            const tokenData = qs.stringify({
                "refresh_token": this.options.refreshToken,
                "grant_type": "refresh_token",
                "scope": "ZohoCliq.Channels.CREATE,ZohoCliq.Channels.READ,ZohoCliq.Channels.UPDATE,ZohoCliq.Channels.DELETE,ZohoCliq.Webhooks.CREATE",
                "client_id": this.options.clientId,
                "client_secret": this.options.clientSecret,
                "redirect_uri": process.env.ZOHO_REDIRECT_URI
            });

            const response = await axios({
                method: 'post',
                url: process.env.ZOHO_OAUTH_TOKEN_URL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: tokenData
            });

            if (!response.data.access_token) {
                throw new Error('No access token in response');
            }

            console.log(`${yellow}✅ OAuth token retrieved successfully`);
            return response.data.access_token;
        } catch (error) {
            console.error('❌ Failed to get token:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Uploads screenshot to Cliq channel
     */
    async uploadScreenshot() {
        console.log(`${yellow}🔍 Checking for screenshot file: ${this.options.filePath}`);
        
        if (!fs.existsSync(this.options.filePath)) {
            console.error('❌ Screenshot not found:', this.options.filePath);
            process.exit(1);
        }

        console.log(`${yellow}✅ Screenshot file found`);

        try {
            const token = await this.getToken();
            
            if (!token) {
                throw new Error('Failed to retrieve valid token');
            }

            console.log(`📤 Sending message to Cliq channel...`);
            
            // First send a message with text
            const messagePayload = {
                text: '📸 Jenkins Allure Report Screenshot'
            };

            const messageResponse = await axios({
                method: 'post',
                url: `${this.options.cliqBaseUrl}/company/${this.options.companyId}/api/v2/channelsbyname/${this.options.channelName}/message`,
                headers: {
                    "Authorization": "Zoho-oauthtoken " + token,
                    "Content-Type": "application/json"
                },
                data: messagePayload
            });

            console.log(`${yellow}✅ Message sent successfully`);

            console.log(`${yellow}📁 Uploading screenshot file...`);
            
            // Then upload the file
            const data = new FormData();
            const fileName = path.basename(this.options.filePath);
            data.append('file', fs.createReadStream(this.options.filePath), { filename: fileName });

            const uploadResponse = await axios({
                method: 'post',
                url: `${this.options.cliqBaseUrl}/company/${this.options.companyId}/api/v2/channelsbyname/${this.options.channelName}/files`,
                headers: {
                    "Authorization": "Zoho-oauthtoken " + token,
                    ...data.getHeaders()
                },
                data: data
            });

            console.log(`${yellow}✅ Screenshot uploaded successfully to Cliq channel`);
        } catch (error) {
            console.error('❌ Failed to send screenshot to Cliq:');
            console.error('Error message:', error.message);
            
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            
            throw error;
        }
    }
}

// Usage with error handling
async function main() {
    try {
        const channelName = process.argv[2] || process.env.ZOHO_CHANNEL_NAME; 
        const uploader = new ScreenshotUploader({
            channelName: channelName,
            filePath: process.env.SCREENSHOT_PATH,
        });
        console.log(`${yellow}📢 Using channel: ${channelName}`);
        await uploader.uploadScreenshot();
    } catch (error) {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    }
}

main();