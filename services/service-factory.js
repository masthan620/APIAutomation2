import BaseDbService from './base-db-service.js';
import dbFactory from './db-factory.js';

// Cache for the created services
const serviceCache = {};

class ServiceFactory {
    /**
     * Get a general database service for any database and table
     * @param {string} dbName - Database name
     * @param {string} tableName - Table name
     * @returns {BaseDbService} - Database service for the specified table
     */
    getDbService(dbName, tableName) {
        const serviceKey = `${dbName}.${tableName}`;
        
        if (!serviceCache[serviceKey]) {
            serviceCache[serviceKey] = new BaseDbService(dbName, tableName);
        }
        
        return serviceCache[serviceKey];
    }
    
    /**
     * Get a service for devices table in any database
     * @param {string} dbName - Database name
     */
    getDevicesService(dbName = 'devicemanagement') {
        const baseService = this.getDbService(dbName, 'devices');
        
        // Extend with device-specific methods
        baseService.getDeviceBySerialNumber = async function(serialNumber) {
            return this.query().where('serial_number', serialNumber).first();
        };
        
        baseService.deviceExists = async function(deviceId) {
            const result = await this.query()
                .where('id', deviceId)
                .count('id as count')
                .first();
            return parseInt(result.count) > 0;
        };
        
        return baseService;
    }
    
    /**
     * Get a service for users table in any database
     * @param {string} dbName - Database name
     */
    getUsersService(dbName = 'usermanagement') {
        const baseService = this.getDbService(dbName, 'users');
        
        // Extend with user-specific methods
        baseService.getUserByEmail = async function(email) {
            return this.query().where('email', email).first();
        };
        
        baseService.getUserByUsername = async function(username) {
            return this.query().where('username', username).first();
        };
        
        return baseService;
    }
}

const serviceFactory = new ServiceFactory();
export default serviceFactory;