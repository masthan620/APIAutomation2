import { Given, Then, When } from '@wdio/cucumber-framework';
import { expect } from '@wdio/globals';
import apiClient from '../../utils/apiClient.js';
import fs from 'fs';
import { generateUniqueId1 } from '../../utils/generateUniqueId.js';
import path from 'path';
import serviceFactory from '../../services/service-factory';
import testData from '../../test-data/testData.json';
import { red, green, yellow, reset } from '../../utils/apiClient.js';

// Function to load request body from JSON
const loadRequestBody = (key) => {
    const dataPath = path.resolve('./test-data/apiRequestBodies.json');
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const requestBodies = JSON.parse(raw);
    return requestBodies[key];
};

function applyOverrides(originalBody, overrides) {
    const resolvedOverrides = { ...originalBody };

    for (const key in overrides) {
        const value = testData[overrides[key]] !== undefined ? testData[overrides[key]] : overrides[key];

        const keys = key.split('.');
        let current = resolvedOverrides;

        for (let i = 0; i < keys.length; i++) {
            const part = keys[i];

            if (i === keys.length - 1) {
                // Final key: assign value
                current[part] = value;
            } else {
                // Intermediate key: ensure nested object exists
                if (!current[part] || typeof current[part] !== 'object') {
                    current[part] = {};
                }
                current = current[part];
            }
        }
    }

    return resolvedOverrides;
}

// ✅ Register device WITHOUT overrides (NO table)
Given(/^register device$/, async function () {
    const endpoint = process.env.DEVICE_REGISTER_ENDPOINT;
    this.requestBody = loadRequestBody("saveDevice");
    this.requestBody.unique_device_id = generateUniqueId1();

    console.log("Final Request Body →", JSON.stringify(this.requestBody, null, 2));

    this.response = await apiClient.post(endpoint, this.requestBody);
    this.regResponse = this.response;
});

// ✅ Register device WITH overrides (WITH table)
Given(/^register device:$/, async function (table) {
    const endpoint = process.env.DEVICE_REGISTER_ENDPOINT;
  
    // Load default request body
    this.requestBody = loadRequestBody("saveDevice");
  
    // Read overrides from DataTable
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
  
    // Auto generate unique ID if not overridden
    if (!overrides.unique_device_id) {
        this.requestBody.unique_device_id = generateUniqueId1();
    }
  
    // Apply overrides from testData if key matches
    this.requestBody = applyOverrides(this.requestBody, overrides);
  
    console.log("Final Request Body →", JSON.stringify(this.requestBody, null, 2));
  
    // Execute API call
    this.response = await apiClient.post(endpoint, this.requestBody);
    this.regResponse = this.response;
});

// ✅ Map device to school WITHOUT schoolCode parameter
Given(/^map the device to school$/, async function () {
    const endpointTemplate = process.env.MAP_DEVICE_ENDPOINT;
    const schoolCode = testData["school_code"];
  
    const responseData = this.regResponse?.body || this.regResponse?.data?.data || this.regResponse;
    const deviceId = responseData.device_id;
  
    if (!deviceId) {
        throw new Error("deviceId not found from previous step.");
    }
  
    const endpoint = endpointTemplate
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);
  
    const requestBody = loadRequestBody("mapDevice");
  
    console.log(`${yellow}📦 Mapping Request Body:`, JSON.stringify(requestBody, null, 2));
  
    const headers = {
        'auth': 'EISecret',
        'Authorization': `${process.env.ACCESS_TOKEN}`,
    };
  
    this.response = await apiClient.post(endpoint, requestBody, headers);
    this.mapResponse = this.response;
});

// ✅ Map device to school WITH specific schoolCode parameter
Given(/^map the device to school with schoolCode "([^"]*)"$/, async function (inputSchoolCode) {
    const endpointTemplate = process.env.MAP_DEVICE_ENDPOINT;
    // Use provided schoolCode or default from testData
    const schoolCode = inputSchoolCode || testData["school_code"];
  
    const responseData = this.regResponse?.body || this.regResponse?.data?.data || this.regResponse;
    const deviceId = responseData.device_id;
  
    if (!deviceId) {
        throw new Error("deviceId not found from previous step.");
    }
  
    const endpoint = endpointTemplate
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);
  
    const requestBody = loadRequestBody("mapDevice");
  
    console.log(`${yellow}📦 Mapping Request Body:`, JSON.stringify(requestBody, null, 2));
  
    const headers = {
        'auth': 'EISecret',
        'Authorization': `${process.env.ACCESS_TOKEN}`,
    };
  
    this.response = await apiClient.post(endpoint, requestBody, headers);
    this.mapResponse = this.response;
});

// ✅ Unmap device from school
When(/^unmap the device from the school$/, async function () {
    const deviceId = this.regResponse?.body?.device_id ?? 
                    this.regResponse?.data?.data?.device_id ?? 
                    this.regResponse?.device_id;
    
    if (!deviceId) {
        throw new Error("deviceId not found from registration response.");
    }
    
    const schoolCode = testData["school_code"];
    const endpoint = process.env.UNMAP_DEVICE_ENDPOINT
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);

    const headers = {
        'auth': 'EISecret',
        'Authorization': `${process.env.ACCESS_TOKEN_UNMAP}`,
        'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
    };
        
    this.response = await apiClient.delete(endpoint, headers);
    this.unmapResponse = this.response;
});