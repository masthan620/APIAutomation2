import { v4 as uuidv4 } from 'uuid';

export const generateUniqueId = () => {
    return uuidv4(); // Generates a unique UUID each time
};

export const generateUniqueId1 = () => {
    return Math.random().toString(36).substring(2, 12); // Generates a 10-character alphanumeric ID
};