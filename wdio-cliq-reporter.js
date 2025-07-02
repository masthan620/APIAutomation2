import axios from 'axios';
import qs from 'qs';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

class CliqReporter {
    constructor(options = {}) {
        this.options = {
            channelName: options.channelName || 'default-channel',
            reportDir: options.reportDir || './reports',
            reportFile: options.reportFile || 'index.html',
            testEnv: options.testEnv || 'Test Environment',
            botName: options.botName || 'WebdriverIO Reporter',
            botImage: options.botImage || 'https://webdriver.io/img/webdriverio.png',
            clientId: process.env.ZOHO_CLIENT_ID,
            clientSecret: process.env.ZOHO_CLIENT_SECRET,
            refreshToken: process.env.ZOHO_REFRESH_TOKEN
        };
    }

    /**
     * Gets Zoho OAuth token
     */
    async getToken() {
        try {
            const response = await axios({
                method: 'post',
                url: 'https://accounts.zoho.in/oauth/v2/token',
                data: qs.stringify({
                    "refresh_token": this.options.refreshToken,
                    "grant_type": "refresh_token",
                    "scope": "ZohoCliq.Channels.CREATE,ZohoCliq.Channels.READ,ZohoCliq.Channels.UPDATE,ZohoCliq.Channels.DELETE,ZohoCliq.Webhooks.CREATE",
                    "client_id": this.options.clientId,
                    "client_secret": this.options.clientSecret,
                    "redirect_uri": "https://www.google.com/"
                })
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Failed to get token:', error.message);
            throw error;
        }
    }

    /**
     * Formats test results for Cliq message
     */
    formatResults(results) {
        if (!results || !results.stats || !results.specs) {
            console.warn('Invalid results object structure. Using default values.');
            return [{
                "Sl No": 1,
                "Spec File Name": "Unknown",
                "Total TC": 0,
                "Total Passed TC": 0,
                "Total Failed TC": 0,
                "Total Skipped TC": 0
            }];
        }

        const { stats, specs } = results;
        const format = [];

        try {
            specs.forEach((spec, index) => {
                const specFile = spec.file || 'Unknown';
                const specName = specFile.includes('/') || specFile.includes('\\') 
                    ? path.basename(specFile, path.extname(specFile))
                    : specFile;

                let totalTests = spec.total !== undefined ? spec.total : (spec.tests || []).length;
                let passedTests = spec.passes !== undefined ? spec.passes : (spec.tests || []).filter(t => t && t.state === 'passed').length;
                let failedTests = spec.failures !== undefined ? spec.failures : (spec.tests || []).filter(t => t && t.state === 'failed').length;
                let skippedTests = spec.skipped !== undefined ? spec.skipped : (spec.tests || []).filter(t => t && (t.state === 'skipped' || t.state === 'pending')).length;

                totalTests = isNaN(totalTests) ? 0 : totalTests;
                passedTests = isNaN(passedTests) ? 0 : passedTests;
                failedTests = isNaN(failedTests) ? 0 : failedTests;
                skippedTests = isNaN(skippedTests) ? 0 : skippedTests;

                format.push({
                    "Sl No": index + 1,
                    "Spec File Name": specName,
                    "Total TC": totalTests,
                    "Total Passed TC": passedTests, 
                    "Total Failed TC": failedTests,
                    "Total Skipped TC": skippedTests
                });
            });

            let totalSpecTests = 0, totalSpecPassed = 0, totalSpecFailed = 0, totalSpecSkipped = 0;
            format.forEach(row => {
                if (row["Sl No"] !== "--") {
                    totalSpecTests += row["Total TC"];
                    totalSpecPassed += row["Total Passed TC"];
                    totalSpecFailed += row["Total Failed TC"];
                    totalSpecSkipped += row["Total Skipped TC"];
                }
            });

            const totalTests = stats.tests || totalSpecTests;
            const totalPassed = stats.passes || totalSpecPassed;
            const totalFailed = stats.failures || totalSpecFailed;
            const totalSkipped = (stats.skipped || stats.pending || totalSpecSkipped);

            format.push({
                "Sl No": "--",
                "Spec File Name": "Total",
                "Total TC": totalTests,
                "Total Passed TC": totalPassed,
                "Total Failed TC": totalFailed,
                "Total Skipped TC": totalSkipped
            });

            return format;
        } catch (error) {
            console.error('Error formatting results:', error);
            return [{
                "Sl No": 1,
                "Spec File Name": "Error",
                "Total TC": 0,
                "Total Passed TC": 0,
                "Total Failed TC": 0,
                "Total Skipped TC": 0
            }];
        }
    }

    /**
     * Creates message body for Cliq
     */
    createMessageBody(results) {
        const format = this.formatResults(results);
        const isFailed = results.stats && results.stats.failures > 0;

        if (isFailed && results.stats.tests === (results.stats.failures + results.stats.skipped) && results.stats.failures === 1) {
            return {
                "text": `Pre-validation failure for ${this.options.testEnv}. Basic test scenario failed.`,
                "bot": {
                    "name": this.options.botName,
                    "image": this.options.botImage
                },
                "card": {
                    "theme": "prompt",
                    "title": "Alert! -- Test Failure in " + this.options.testEnv
                }
            };
        } else {
            return {
                "text": `Hi Team! Test execution results for ${this.options.testEnv}`,
                "bot": {
                    "name": this.options.botName,
                    "image": this.options.botImage
                },
                "card": {
                    "title": this.options.testEnv,
                    "theme": "modern-inline"
                },
                "slides": [
                    {
                        "type": "table",
                        "title": "Details of Execution",
                        "data": {
                            "headers": [
                                "Sl No",
                                "Spec File Name",
                                "Total TC",
                                "Total Passed TC",
                                "Total Failed TC",
                                "Total Skipped TC"
                            ],
                            "rows": format
                        }
                    }
                ]
            };
        }
    }

    /**
     * Sends message to Cliq channel
     */
    async sendMessageToCliq(results) {
        try {
            const token = await this.getToken();
            const messageBody = this.createMessageBody(results);
            const channelNameUrl = `https://cliq.zoho.in/company/60001695168/api/v2/channelsbyname/${this.options.channelName}/message`;

            await axios({
                method: 'post',
                url: channelNameUrl,
                headers: {
                    "Authorization": "Zoho-oauthtoken " + token,
                    "contentType": "application/json"
                },
                data: messageBody
            });

            const reportPath = path.join(this.options.reportDir, this.options.reportFile);
            if (fs.existsSync(reportPath)) {
                const data = new FormData();
                const fileName = `${this.options.testEnv}_report.html`;
                data.append('file', fs.createReadStream(reportPath), { filename: fileName });

                await axios({
                    method: 'post',
                    url: `https://cliq.zoho.in/company/60001695168/api/v2/channelsbyname/${this.options.channelName}/files`,
                    headers: {
                        "Authorization": "Zoho-oauthtoken " + token,
                        ...data.getHeaders()
                    },
                    data: data
                });

                console.log('Message and report sent to Cliq channel successfully');
            } else {
                console.warn(`Report file not found: ${reportPath}`);
            }
        } catch (error) {
            console.error('Failed to send message to Cliq:', error.message);
        }
    }
}

export default CliqReporter;
