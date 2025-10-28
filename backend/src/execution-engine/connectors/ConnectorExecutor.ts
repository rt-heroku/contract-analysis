import prisma from '../../config/database';
import logger from '../../utils/logger';
import axios from 'axios';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import * as SFTPClient from 'ssh2-sftp-client';

export interface ConnectorExecutionContext {
  connector: any;
  connectorAction: any;
  inputData: any;
  executionContext: any;
}

export class ConnectorExecutor {
  /**
   * Execute a connector action
   */
  async execute(context: ConnectorExecutionContext): Promise<any> {
    const { connector, connectorAction, inputData } = context;

    logger.info(`Executing connector action: ${connector.name}.${connectorAction.operation}`);

    switch (connector.connectorType) {
      case 'rest':
        return await this.executeRestAction(connector, connectorAction, inputData);
      case 'database':
        return await this.executeDatabaseAction(connector, connectorAction, inputData);
      case 'file':
      case 'filesystem':
      case 'local_file':
        return await this.executeFileAction(connector, connectorAction, inputData);
      case 's3':
        return await this.executeS3Action(connector, connectorAction, inputData);
      case 'ftp':
      case 'sftp':
        return await this.executeFTPAction(connector, connectorAction, inputData);
      default:
        throw new Error(`Unsupported connector type: ${connector.connectorType}`);
    }
  }

  /**
   * Execute REST API connector action
   */
  private async executeRestAction(connector: any, action: any, inputData: any): Promise<any> {
    try {
      const config = connector.config;
      const baseUrl = config.baseUrl || '';
      
      // Build URL with path parameters
      let url = baseUrl + action.path;
      if (inputData.pathParams) {
        for (const [key, value] of Object.entries(inputData.pathParams)) {
          url = url.replace(`{${key}}`, String(value));
        }
      }

      // Build request config
      const requestConfig: any = {
        method: action.method,
        url,
        headers: {
          ...config.defaultHeaders,
          ...inputData.headers,
        },
      };

      // Add auth headers
      if (config.authType === 'bearer' && config.token) {
        requestConfig.headers['Authorization'] = `Bearer ${config.token}`;
      } else if (config.authType === 'api_key' && config.apiKey) {
        requestConfig.headers[config.apiKeyHeader || 'X-API-Key'] = config.apiKey;
      } else if (config.authType === 'basic' && config.username && config.password) {
        requestConfig.auth = {
          username: config.username,
          password: config.password,
        };
      }

      // Add query parameters
      if (inputData.queryParams) {
        requestConfig.params = inputData.queryParams;
      }

      // Add request body
      if (inputData.body && ['POST', 'PUT', 'PATCH'].includes(action.method)) {
        requestConfig.data = inputData.body;
      }

      // Execute request
      const response = await axios(requestConfig);

      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('REST connector execution error:', error);
      throw new Error(`REST API call failed: ${error.message}`);
    }
  }

  /**
   * Execute Database connector action
   */
  private async executeDatabaseAction(connector: any, action: any, inputData: any): Promise<any> {
    const config = connector.config;
    const pool = new Pool({
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.poolSize || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    try {
      const operation = action.operation;
      logger.info(`Executing DB operation: ${operation}`);

      switch (operation) {
        case 'query': {
          const result = await pool.query(inputData.sql, inputData.values || []);
          return {
            success: true,
            operation: 'query',
            rowCount: result.rowCount,
            rows: result.rows,
            fields: result.fields?.map((f: any) => f.name),
          };
        }

        case 'query_all': {
          const page = inputData.page || 1;
          const pageSize = inputData.pageSize || 100;
          const offset = (page - 1) * pageSize;
          
          // Get total count
          const countResult = await pool.query(`SELECT COUNT(*) FROM (${inputData.sql}) as count_query`, inputData.values || []);
          const total = parseInt(countResult.rows[0].count);
          
          // Get paginated results
          const query = `${inputData.sql} LIMIT $${(inputData.values?.length || 0) + 1} OFFSET $${(inputData.values?.length || 0) + 2}`;
          const values = [...(inputData.values || []), pageSize, offset];
          const result = await pool.query(query, values);
          
          return {
            success: true,
            operation: 'query_all',
            rowCount: result.rowCount,
            rows: result.rows,
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize),
            },
          };
        }

        case 'insert': {
          const columns = Object.keys(inputData.data);
          const values = Object.values(inputData.data);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const sql = `INSERT INTO ${inputData.table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
          
          const result = await pool.query(sql, values);
          return {
            success: true,
            operation: 'insert',
            table: inputData.table,
            inserted: result.rows[0],
            rowCount: result.rowCount,
          };
        }

        case 'update': {
          const columns = Object.keys(inputData.data);
          const values = Object.values(inputData.data);
          const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
          
          // Build WHERE clause
          const whereColumns = Object.keys(inputData.where);
          const whereValues = Object.values(inputData.where);
          const whereClause = whereColumns.map((col, i) => `${col} = $${values.length + i + 1}`).join(' AND ');
          
          const sql = `UPDATE ${inputData.table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
          const allValues = [...values, ...whereValues];
          
          const result = await pool.query(sql, allValues);
          return {
            success: true,
            operation: 'update',
            table: inputData.table,
            updated: result.rows,
            rowCount: result.rowCount,
          };
        }

        case 'delete': {
          const whereColumns = Object.keys(inputData.where);
          const whereValues = Object.values(inputData.where);
          const whereClause = whereColumns.map((col, i) => `${col} = $${i + 1}`).join(' AND ');
          
          const sql = `DELETE FROM ${inputData.table} WHERE ${whereClause} RETURNING *`;
          const result = await pool.query(sql, whereValues);
          
          return {
            success: true,
            operation: 'delete',
            table: inputData.table,
            deleted: result.rows,
            rowCount: result.rowCount,
          };
        }

        case 'execute': {
          const result = await pool.query(inputData.sql, inputData.values || []);
          return {
            success: true,
            operation: 'execute',
            rowCount: result.rowCount,
            rows: result.rows,
          };
        }

        case 'transaction': {
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            const results = [];
            
            for (const query of inputData.queries) {
              const result = await client.query(query.sql, query.values || []);
              results.push({
                rowCount: result.rowCount,
                rows: result.rows,
              });
            }
            
            await client.query('COMMIT');
            return {
              success: true,
              operation: 'transaction',
              results,
              queriesExecuted: inputData.queries.length,
            };
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        }

        default:
          throw new Error(`Unsupported DB operation: ${operation}`);
      }
    } catch (error: any) {
      logger.error('Database connector execution error:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    } finally {
      await pool.end();
    }
  }

  /**
   * Execute File System connector action
   */
  private async executeFileAction(connector: any, action: any, inputData: any): Promise<any> {
    const basePath = connector.config.basePath || '/tmp';
    
    try {
      const operation = action.operation;
      logger.info(`Executing File operation: ${operation}`);

      // Security: resolve path to prevent directory traversal
      const resolvePath = (filePath: string) => {
        const resolved = path.resolve(basePath, filePath);
        if (!resolved.startsWith(basePath)) {
          throw new Error('Access denied: Path outside base directory');
        }
        return resolved;
      };

      switch (operation) {
        case 'read': {
          const filePath = resolvePath(inputData.path);
          const content = await fs.readFile(filePath, inputData.encoding || 'utf8');
          const stats = await fs.stat(filePath);
          
          return {
            success: true,
            operation: 'read',
            path: inputData.path,
            content,
            size: stats.size,
            encoding: inputData.encoding || 'utf8',
          };
        }

        case 'write': {
          const filePath = resolvePath(inputData.path);
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, inputData.content, inputData.encoding || 'utf8');
          const stats = await fs.stat(filePath);
          
          return {
            success: true,
            operation: 'write',
            path: inputData.path,
            bytesWritten: stats.size,
          };
        }

        case 'append': {
          const filePath = resolvePath(inputData.path);
          await fs.appendFile(filePath, inputData.content, 'utf8');
          const stats = await fs.stat(filePath);
          
          return {
            success: true,
            operation: 'append',
            path: inputData.path,
            size: stats.size,
          };
        }

        case 'delete': {
          const filePath = resolvePath(inputData.path);
          await fs.unlink(filePath);
          
          return {
            success: true,
            operation: 'delete',
            path: inputData.path,
            deleted: true,
          };
        }

        case 'exists': {
          const filePath = resolvePath(inputData.path);
          try {
            await fs.access(filePath);
            return {
              success: true,
              operation: 'exists',
              path: inputData.path,
              exists: true,
            };
          } catch {
            return {
              success: true,
              operation: 'exists',
              path: inputData.path,
              exists: false,
            };
          }
        }

        case 'list': {
          const dirPath = resolvePath(inputData.path);
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          const files = await Promise.all(entries.map(async (entry) => {
            const fullPath = path.join(dirPath, entry.name);
            const stats = await fs.stat(fullPath);
            return {
              name: entry.name,
              isDirectory: entry.isDirectory(),
              isFile: entry.isFile(),
              size: stats.size,
              modified: stats.mtime,
              created: stats.birthtime,
            };
          }));
          
          return {
            success: true,
            operation: 'list',
            path: inputData.path,
            files,
            count: files.length,
          };
        }

        case 'copy': {
          const sourcePath = resolvePath(inputData.source);
          const destPath = resolvePath(inputData.destination);
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.copyFile(sourcePath, destPath);
          
          return {
            success: true,
            operation: 'copy',
            source: inputData.source,
            destination: inputData.destination,
          };
        }

        case 'move': {
          const sourcePath = resolvePath(inputData.source);
          const destPath = resolvePath(inputData.destination);
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.rename(sourcePath, destPath);
          
          return {
            success: true,
            operation: 'move',
            source: inputData.source,
            destination: inputData.destination,
          };
        }

        case 'mkdir': {
          const dirPath = resolvePath(inputData.path);
          await fs.mkdir(dirPath, { recursive: inputData.recursive !== false });
          
          return {
            success: true,
            operation: 'mkdir',
            path: inputData.path,
            created: true,
          };
        }

        case 'stat': {
          const filePath = resolvePath(inputData.path);
          const stats = await fs.stat(filePath);
          
          return {
            success: true,
            operation: 'stat',
            path: inputData.path,
            stats: {
              size: stats.size,
              isFile: stats.isFile(),
              isDirectory: stats.isDirectory(),
              modified: stats.mtime,
              created: stats.birthtime,
              accessed: stats.atime,
            },
          };
        }

        default:
          throw new Error(`Unsupported File operation: ${operation}`);
      }
    } catch (error: any) {
      logger.error('File connector execution error:', error);
      throw new Error(`File operation failed: ${error.message}`);
    }
  }

  /**
   * Execute S3 connector action
   */
  private async executeS3Action(connector: any, action: any, inputData: any): Promise<any> {
    const config = connector.config;
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle || false,
    });

    try {
      const operation = action.operation;
      const bucket = config.bucket;
      logger.info(`Executing S3 operation: ${operation}`);

      switch (operation) {
        case 'upload': {
          const command = new PutObjectCommand({
            Bucket: bucket,
            Key: inputData.key,
            Body: Buffer.from(inputData.content, inputData.encoding || 'utf8'),
            ContentType: inputData.contentType || 'application/octet-stream',
            Metadata: inputData.metadata || {},
          });
          
          await s3Client.send(command);
          
          return {
            success: true,
            operation: 'upload',
            bucket,
            key: inputData.key,
            contentType: inputData.contentType,
          };
        }

        case 'download': {
          const command = new GetObjectCommand({
            Bucket: bucket,
            Key: inputData.key,
          });
          
          const response = await s3Client.send(command);
          const content = await response.Body?.transformToString();
          
          return {
            success: true,
            operation: 'download',
            bucket,
            key: inputData.key,
            content,
            contentType: response.ContentType,
            contentLength: response.ContentLength,
            lastModified: response.LastModified,
          };
        }

        case 'delete': {
          const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: inputData.key,
          });
          
          await s3Client.send(command);
          
          return {
            success: true,
            operation: 'delete',
            bucket,
            key: inputData.key,
            deleted: true,
          };
        }

        case 'list': {
          const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: inputData.prefix || '',
            MaxKeys: inputData.maxKeys || 1000,
            ContinuationToken: inputData.continuationToken,
          });
          
          const response = await s3Client.send(command);
          
          return {
            success: true,
            operation: 'list',
            bucket,
            prefix: inputData.prefix,
            objects: response.Contents?.map(obj => ({
              key: obj.Key,
              size: obj.Size,
              lastModified: obj.LastModified,
              etag: obj.ETag,
            })) || [],
            count: response.KeyCount,
            isTruncated: response.IsTruncated,
            nextContinuationToken: response.NextContinuationToken,
          };
        }

        case 'exists': {
          try {
            const command = new HeadObjectCommand({
              Bucket: bucket,
              Key: inputData.key,
            });
            
            const response = await s3Client.send(command);
            
            return {
              success: true,
              operation: 'exists',
              bucket,
              key: inputData.key,
              exists: true,
              size: response.ContentLength,
              lastModified: response.LastModified,
            };
          } catch (error: any) {
            if (error.name === 'NotFound') {
              return {
                success: true,
                operation: 'exists',
                bucket,
                key: inputData.key,
                exists: false,
              };
            }
            throw error;
          }
        }

        case 'copy': {
          const sourceKey = inputData.sourceKey;
          const destKey = inputData.destinationKey;
          const destBucket = inputData.destinationBucket || bucket;
          
          const copySource = `${bucket}/${sourceKey}`;
          const command = new CopyObjectCommand({
            Bucket: destBucket,
            Key: destKey,
            CopySource: copySource,
          });
          
          await s3Client.send(command);
          
          return {
            success: true,
            operation: 'copy',
            sourceBucket: bucket,
            sourceKey,
            destinationBucket: destBucket,
            destinationKey: destKey,
          };
        }

        case 'move': {
          // Move = Copy + Delete
          const sourceKey = inputData.sourceKey;
          const destKey = inputData.destinationKey;
          
          // Copy
          const copySource = `${bucket}/${sourceKey}`;
          const copyCommand = new CopyObjectCommand({
            Bucket: bucket,
            Key: destKey,
            CopySource: copySource,
          });
          await s3Client.send(copyCommand);
          
          // Delete source
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucket,
            Key: sourceKey,
          });
          await s3Client.send(deleteCommand);
          
          return {
            success: true,
            operation: 'move',
            bucket,
            sourceKey,
            destinationKey: destKey,
          };
        }

        case 'get_url': {
          // Note: For presigned URLs, you'd need @aws-sdk/s3-request-presigner
          // For now, return a basic URL
          const url = config.endpoint 
            ? `${config.endpoint}/${bucket}/${inputData.key}`
            : `https://${bucket}.s3.${config.region}.amazonaws.com/${inputData.key}`;
          
          return {
            success: true,
            operation: 'get_url',
            bucket,
            key: inputData.key,
            url,
            expiresIn: inputData.expiresIn || 3600,
            note: 'Basic URL generated. For presigned URLs, install @aws-sdk/s3-request-presigner',
          };
        }

        default:
          throw new Error(`Unsupported S3 operation: ${operation}`);
      }
    } catch (error: any) {
      logger.error('S3 connector execution error:', error);
      throw new Error(`S3 operation failed: ${error.message}`);
    }
  }

  /**
   * Execute FTP/SFTP connector action
   */
  private async executeFTPAction(connector: any, action: any, inputData: any): Promise<any> {
    try {
      const operation = action.operation;

      logger.info(`Executing FTP operation: ${operation}`);

      // Note: This is a simplified implementation
      // In production, you'd use ssh2-sftp-client or basic-ftp
      switch (operation) {
        case 'upload':
          return {
            success: true,
            operation: 'upload',
            remotePath: inputData.remotePath,
            message: 'FTP connector not yet fully implemented',
          };

        case 'download':
          return {
            success: true,
            operation: 'download',
            remotePath: inputData.remotePath,
            content: null,
            message: 'FTP connector not yet fully implemented',
          };

        case 'list':
          return {
            success: true,
            operation: 'list',
            remotePath: inputData.remotePath,
            files: [],
            message: 'FTP connector not yet fully implemented',
          };

        default:
          throw new Error(`Unsupported FTP operation: ${operation}`);
      }
    } catch (error: any) {
      logger.error('FTP connector execution error:', error);
      throw new Error(`FTP operation failed: ${error.message}`);
    }
  }

  /**
   * Load connector from database
   */
  async loadConnector(connectorId: number): Promise<any> {
    try {
      const connector = await prisma.connector.findUnique({
        where: { id: connectorId },
      });

      if (!connector) {
        throw new Error(`Connector ${connectorId} not found`);
      }

      return connector;
    } catch (error: any) {
      logger.error('Error loading connector:', error);
      throw error;
    }
  }

  /**
   * Load connector action from database
   */
  async loadConnectorAction(connectorId: number, operation: string): Promise<any> {
    try {
      const action = await prisma.connectorAction.findFirst({
        where: {
          connectorId,
          operation,
          isActive: true,
        },
      });

      if (!action) {
        throw new Error(`Connector action ${operation} not found for connector ${connectorId}`);
      }

      return action;
    } catch (error: any) {
      logger.error('Error loading connector action:', error);
      throw error;
    }
  }
}

export default new ConnectorExecutor();

