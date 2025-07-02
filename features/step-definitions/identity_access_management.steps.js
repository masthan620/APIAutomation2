import { Given, Then } from "@wdio/cucumber-framework";
import { expect } from "@wdio/globals";
import apiClient from "../../utils/apiClient.js"; //
import fs from "fs";
import { generateUniqueId1 } from "../../utils/generateUniqueId.js";
import path from "path";
import serviceFactory from "../../services/service-factory";
import { applyOverrides, loadRequestBody } from "../helpers/utilityCommands.js";

Given(
  /^Send an OTP request using "([^"]*)" request body$/,
  async function (bodyKey) {
    const endpoint = process.env.OTP_ENDPOINT;
    let requestBody = loadRequestBody(bodyKey);
    if (!requestBody) {
      throw new Error("Loaded requestBody is undefined");
    }
    // Capture start time
    const startTime = Date.now();
    this.response = await apiClient.post(endpoint, requestBody);
    // Capture end time and calculate duration
    const endTime = Date.now();
    this.responseTime = endTime - startTime;

    console.log(`${endpoint} took ${this.responseTime}ms`);
  }
);

Given(
  /^Send an OTP request using "([^"]*)" request body:$/,
  async function (bodyKey, table) {
    const endpoint = process.env.OTP_ENDPOINT;
    let requestBody = loadRequestBody(bodyKey);
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));

    requestBody = applyOverrides(requestBody, overrides);
    // console.log("Final Request Body →", JSON.stringify(requestBody, null, 2));
    this.response = await apiClient.post(endpoint, requestBody);
  }
);
