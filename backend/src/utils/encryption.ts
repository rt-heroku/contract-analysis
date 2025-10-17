import crypto from 'crypto';

// Use environment variable or generate a consistent key for the session
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);

const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

export const encryption = {
  /**
   * Encrypt a text value
   */
  encrypt(text: string): string {
    if (!text) return '';
    
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(
        ALGORITHM,
        ENCRYPTION_KEY,
        iv
      );
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  },

  /**
   * Decrypt a text value
   */
  decrypt(text: string): string {
    if (!text) return '';
    
    try {
      const parts = text.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        ENCRYPTION_KEY,
        iv
      );
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  },

  /**
   * Parse MuleSoft IDP URL
   * Example: https://idp-rt.us-east-1.anypoint.mulesoft.com/api/v1/organizations/eb16587a-02cf-43f4-aa5f-c6a924fb3635/actions/1665e50a-9f68-43d0-a533-49bfc24d920b/versions/1.3.0/executions
   */
  parseIdpUrl(url: string): {
    protocol: string;
    host: string;
    basePath: string;
    orgId: string;
    actionId: string;
    actionVersion: string;
  } | null {
    try {
      // Remove leading @ if present
      const cleanUrl = url.trim().replace(/^@/, '');
      
      // Pattern: protocol://host/api/v1/organizations/ORG_ID/actions/ACTION_ID/versions/VERSION/executions
      const regex = /^(https?):\/\/([^\/]+)(\/api\/v1\/organizations\/)([^\/]+)\/actions\/([^\/]+)\/versions\/([^\/]+)\/executions\/?$/i;
      const match = cleanUrl.match(regex);
      
      if (!match) {
        return null;
      }
      
      return {
        protocol: match[1].toUpperCase(),
        host: match[2],
        basePath: match[3],
        orgId: match[4],
        actionId: match[5],
        actionVersion: match[6],
      };
    } catch (error) {
      console.error('URL parsing error:', error);
      return null;
    }
  },

  /**
   * Mask sensitive data for display
   */
  maskSecret(text: string): string {
    if (!text || text.length < 8) return '***';
    
    // Show first 4 and last 4 characters
    const start = text.substring(0, 4);
    const end = text.substring(text.length - 4);
    return `${start}***${end}`;
  },

  /**
   * Build full IDP URL from components
   */
  buildIdpUrl(config: {
    protocol: string;
    host: string;
    basePath: string;
    orgId: string;
    actionId: string;
    actionVersion: string;
  }): string {
    return `${config.protocol.toLowerCase()}://${config.host}${config.basePath}${config.orgId}/actions/${config.actionId}/versions/${config.actionVersion}/executions`;
  }
};

