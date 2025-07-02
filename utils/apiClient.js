import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const red = "\x1b[31m";
export const green = "\x1b[32m";
export const yellow = "\x1b[33m";
export const reset = "\x1b[0m";

const instance = axios.create({
    baseURL: process.env.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

class ApiClient {
    static async get(endpoint, headers = {}) {
        const start = Date.now();
        try {
            const response = await instance.get(endpoint, { headers });
            const duration = Date.now() - start;
            console.log(`${green}GET ${endpoint} took ${duration}ms${reset}`);
            console.log(`${yellow}Response:${reset} ${JSON.stringify(response.data)}`);
            return response;
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`${red}GET ${endpoint} failed after ${duration}ms:${reset} ${error.message}`);
            if (error.response) {
                console.error(`${red}Status ${error.response.status}:${reset} ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    static async post(endpoint, data = {}, headers = {}) {
        const start = Date.now();
        try {
            const response = await instance.post(endpoint, data, { headers });
            const duration = Date.now() - start;
            console.log(`${green}POST ${endpoint} took ${duration}ms${reset}`);
            console.log(`${yellow}Response:${reset} ${JSON.stringify(response.data)}`);
            console.log(`${yellow}Device_id:${reset} ${JSON.stringify(response.data.device_id)}`);
            console.log(`${yellow}Response type:`, typeof this.response);
            return response;
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`${red}POST ${endpoint} failed after ${duration}ms:${reset} ${error.message}`);
            console.error(`${red}Request Body:${reset} ${JSON.stringify(data, null, 2)}`);
            
            if (error.response) {
                // Log the error response details
                console.error(`${red}Status ${error.response.status}:${reset} ${JSON.stringify(error.response.data)}`);
                // Return the error response object
                return error.response;
            }
            
            // Return a standardized error response for network errors or other issues
            return {
                status: 600,  // Custom status code to indicate a non-HTTP error
                data: {
                    status: false,
                    message: error.message || "Unknown error occurred",
                    code: "NETWORK_ERROR"
                }
            };
        }
    }

    static async put(endpoint, data = {}, headers = {}) {
        const start = Date.now();
        try {
            const response = await instance.put(endpoint, data, { headers });
            const duration = Date.now() - start;
            console.log(`${green}PUT ${endpoint} took ${duration}ms${reset}`);
            console.log(`${yellow}Response:${reset} ${JSON.stringify(response.data)}`);
            return response;
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`${red}PUT ${endpoint} failed after ${duration}ms:${reset} ${error.message}`);
            console.error(`${red}Request Body:${reset} ${JSON.stringify(data, null, 2)}`);
            if (error.response) {
                console.error(`${red}Status ${error.response.status}:${reset} ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    static async delete(endpoint, headers = {}) {
        const start = Date.now();
        try {
            const response = await instance.delete(endpoint, { headers });
            const duration = Date.now() - start;
            console.log(`${green}DELETE ${endpoint} took ${duration}ms${reset}`);
            console.log(`${yellow}Response:${reset} ${JSON.stringify(response.data)}`);
            return response;
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`${red}DELETE ${endpoint} failed after ${duration}ms:${reset} ${error.message}`);
            if (error.response) {
                console.error(`${red}Status ${error.response.status}:${reset} ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
}

export default ApiClient;
