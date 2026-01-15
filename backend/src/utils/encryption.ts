import crypto from 'crypto';
import config from '../config/env';

const ALGORITHM = 'aes-256-cbc';
// Access environment key, ensuring it's 32 chars long or hash it to be 32 bytes
const getKey = () => {
    const key = config.get('ENCRYPTION_KEY');
    if (key.length === 32) return Buffer.from(key);
    // Fallback: create a 32 byte hash from the key
    return crypto.createHash('sha256').update(key).digest();
};

export const encrypt = (text: string): string => {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Store IV with the encrypted text, separated by ':'
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
    if (!text) return '';
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // Not encrypted properly

    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

// Deterministic hash for blind indexing (finding duplicates w/o decrypting)
export const hashData = (text: string): string => {
    return crypto.createHash('sha256').update(text).digest('hex');
};
