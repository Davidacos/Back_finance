import { randomUUID } from 'crypto';

/**
 * Generate a new UUID v4
 * Uses Node.js native crypto (no external dependency needed)
 */
export const generateId = () => randomUUID();
