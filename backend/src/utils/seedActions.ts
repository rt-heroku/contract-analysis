import prisma from '../config/database';
import logger from './logger';

/**
 * Seed system actions and permissions
 */
export async function seedSystemActions() {
  try {
    logger.info('Seeding system actions...');

    // Get or create a system user for creating actions
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@dreamfields.com' },
    });

    if (!systemUser) {
      // Create system user
      systemUser = await prisma.user.create({
        data: {
          email: 'system@dreamfields.com',
          passwordHash: 'SYSTEM_USER_NO_PASSWORD',
          firstName: 'System',
          lastName: 'User',
          isActive: false, // System user cannot login
        },
      });
      logger.info('Created system user');
    }

    // Define system actions
    const systemActions = [
      {
        name: 'idp_extract',
        displayName: 'IDP Extract',
        description: 'Extract data from documents using MuleSoft IDP',
        actionType: 'system',
        category: 'idp',
        icon: 'FileText',
        color: '#3b82f6',
        configSchema: {
          type: 'object',
          properties: {
            jobId: { type: 'string', description: 'Optional job ID' },
          },
        },
        inputSchema: {
          type: 'object',
          properties: {
            idpExecutionId: { type: 'number', description: 'IDP Execution Configuration ID' },
            file: { type: 'string', description: 'File content in base64' },
            fileName: { type: 'string', description: 'File name' },
            documentType: { type: 'string', description: 'Document type (pdf, docx, etc)' },
          },
          required: ['idpExecutionId', 'file'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            uploadId: { type: 'number' },
            extractedData: { type: 'object' },
            status: { type: 'string' },
            documentName: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'rest_api_call',
        displayName: 'REST API Call',
        description: 'Make HTTP requests to external APIs',
        actionType: 'system',
        category: 'api',
        icon: 'Network',
        color: '#ef4444',
        configSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'API URL' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
            headers: { type: 'object', description: 'HTTP headers' },
            timeout: { type: 'number', default: 30000, description: 'Timeout in milliseconds' },
          },
          required: ['url'],
        },
        inputSchema: {
          type: 'object',
          properties: {
            body: { description: 'Request body' },
            params: { type: 'object', description: 'Query parameters' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            status: { type: 'number' },
            statusText: { type: 'string' },
            headers: { type: 'object' },
            data: { description: 'Response data' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'save_file',
        displayName: 'Save File',
        description: 'Save file content to storage',
        actionType: 'system',
        category: 'storage',
        icon: 'Save',
        color: '#10b981',
        configSchema: {
          type: 'object',
          properties: {
            storeType: { type: 'string', enum: ['database', 's3', 'ftp', 'local'], default: 'database' },
          },
        },
        inputSchema: {
          type: 'object',
          properties: {
            fileName: { type: 'string', description: 'File name' },
            fileContent: { description: 'File content (base64 or raw)' },
            fileType: { type: 'string', description: 'File type' },
            mimeType: { type: 'string', description: 'MIME type' },
          },
          required: ['fileName', 'fileContent'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            fileId: { type: 'number' },
            fileName: { type: 'string' },
            fileSize: { type: 'number' },
            storeType: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'conditional',
        displayName: 'Conditional',
        description: 'Advanced conditional logic with multiple conditions using AND/OR operators',
        actionType: 'system',
        category: 'control_flow',
        icon: 'Filter',
        color: '#8b5cf6',
        configSchema: {
          type: 'object',
          properties: {
            conditions: {
              type: 'array',
              description: 'Array of condition groups with logic operators',
              items: {
                type: 'object',
                properties: {
                  conditions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string', description: 'Field or variable to check' },
                        operator: { 
                          type: 'string', 
                          enum: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 
                                 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 
                                 'is_empty', 'is_not_empty', 'is_true', 'is_false'],
                          description: 'Comparison operator'
                        },
                        value: { description: 'Value to compare against' },
                      },
                      required: ['field', 'operator'],
                    },
                  },
                  logicOperator: { type: 'string', enum: ['and', 'or'], description: 'Logic operator (AND/OR)' },
                },
              },
            },
          },
          required: ['conditions'],
        },
        inputSchema: {
          type: 'object',
          description: 'Data used for condition evaluation',
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'boolean', description: 'Overall condition evaluation result' },
            matchedConditions: { type: 'array', description: 'List of conditions that matched' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'if_then_else',
        displayName: 'IF THEN ELSE',
        description: 'Conditional branching - evaluates condition and routes to IF or ELSE branch',
        actionType: 'system',
        category: 'control_flow',
        icon: 'GitBranch',
        color: '#f59e0b',
        configSchema: {
          type: 'object',
          properties: {
            conditions: {
              type: 'array',
              description: 'Array of condition groups (uses ConditionalEditor)',
            },
            condition: { description: 'Legacy: Simple condition string (backward compatibility)' },
            trueValue: { description: 'Value returned when condition is true' },
            falseValue: { description: 'Value returned when condition is false' },
          },
        },
        inputSchema: {
          type: 'object',
          description: 'Data used for condition evaluation',
        },
        outputSchema: {
          type: 'object',
          properties: {
            conditionResult: { type: 'boolean' },
            selectedValue: { description: 'The value from the selected branch' },
            branchTaken: { type: 'string', enum: ['if', 'else'] },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          maxBranches: 2, // Only IF and ELSE branches
          branchLabels: ['if', 'else'],
        },
      },
      {
        name: 'switch_case',
        displayName: 'Switch Case',
        description: 'Multi-way branching based on expression value - supports unlimited cases with default',
        actionType: 'system',
        category: 'control_flow',
        icon: 'GitBranch',
        color: '#8b5cf6',
        configSchema: {
          type: 'object',
          properties: {
            expression: { description: 'Expression to evaluate and match against cases' },
            cases: {
              type: 'array',
              description: 'Array of case values to match',
              items: {
                type: 'object',
                properties: {
                  value: { description: 'Case value to match' },
                  label: { type: 'string', description: 'Display label for this case' },
                },
              },
            },
            defaultLabel: { type: 'string', default: 'default', description: 'Label for default case' },
          },
          required: ['expression'],
        },
        inputSchema: {
          type: 'object',
          description: 'Data used for expression evaluation',
        },
        outputSchema: {
          type: 'object',
          properties: {
            expressionValue: { description: 'The evaluated expression value' },
            matchedCase: { description: 'The case that was matched' },
            branchTaken: { type: 'string', description: 'Label of the branch taken' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          maxBranches: -1, // Unlimited branches
          requiresDefault: true,
        },
      },
      {
        name: 'try_block',
        displayName: 'Try Block',
        description: 'Start of error handling region - executes protected code',
        actionType: 'system',
        category: 'error_handling',
        icon: 'ShieldAlert',
        color: '#3b82f6',
        configSchema: {
          type: 'object',
          properties: {
            errorVariable: { type: 'string', default: 'error', description: 'Variable name for error object' },
            captureStackTrace: { type: 'boolean', default: true, description: 'Capture full stack trace on error' },
            timeoutMs: { type: 'number', description: 'Optional timeout for try block execution' },
          },
        },
        inputSchema: {
          type: 'object',
          description: 'Input data for try block',
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Whether execution succeeded' },
            result: { description: 'Result from try block' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          isContainer: true,
          hasErrorHandle: true,
        },
      },
      {
        name: 'catch_block',
        displayName: 'Catch Block',
        description: 'Error handler - executes only when Try block throws an error',
        actionType: 'system',
        category: 'error_handling',
        icon: 'AlertOctagon',
        color: '#ef4444',
        configSchema: {
          type: 'object',
          properties: {
            errorTypes: { 
              type: 'array', 
              items: { type: 'string' },
              default: ['all'],
              description: 'Error types to catch (all, ValidationError, SystemError, NetworkError)' 
            },
            logError: { type: 'boolean', default: true, description: 'Log error to activity log' },
            errorVariable: { type: 'string', default: 'error', description: 'Variable name for error object' },
            extractErrorDetails: { type: 'boolean', default: true, description: 'Extract error message, code, stack' },
          },
        },
        inputSchema: {
          type: 'object',
          description: 'Error object from try block',
        },
        outputSchema: {
          type: 'object',
          properties: {
            errorHandled: { type: 'boolean' },
            errorMessage: { type: 'string' },
            errorCode: { type: 'string' },
            errorStack: { type: 'string' },
            result: { description: 'Result from catch block' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          requiresTryBlock: true,
        },
      },
      {
        name: 'finally_block',
        displayName: 'Finally Block',
        description: 'Cleanup/convergence - ALWAYS executes after try/catch',
        actionType: 'system',
        category: 'error_handling',
        icon: 'RefreshCw',
        color: '#8b5cf6',
        configSchema: {
          type: 'object',
          properties: {
            alwaysExecute: { type: 'boolean', default: true, description: 'Always execute regardless of success/error' },
            logExecution: { type: 'boolean', default: false, description: 'Log finally block execution' },
          },
        },
        inputSchema: {
          type: 'object',
          description: 'Merged data from try success or catch output',
        },
        outputSchema: {
          type: 'object',
          properties: {
            executed: { type: 'boolean' },
            sourceBlock: { type: 'string', enum: ['try', 'catch'], description: 'Which block led to finally' },
            result: { description: 'Result from finally block' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          isConvergencePoint: true,
          acceptsMultipleInputs: true,
        },
      },
      {
        name: 'raise_error',
        displayName: 'Raise Error',
        description: 'Throw an error to trigger error handling flow',
        actionType: 'system',
        category: 'error_handling',
        icon: 'AlertTriangle',
        color: '#dc2626',
        configSchema: {
          type: 'object',
          properties: {
            errorMessage: { type: 'string', description: 'Error message to throw' },
            errorCode: { type: 'string', description: 'Error code for identification' },
            errorType: { type: 'string', default: 'UserError', description: 'Type of error (UserError, ValidationError, SystemError)' },
            statusCode: { type: 'number', default: 500, description: 'HTTP status code' },
            includeStackTrace: { type: 'boolean', default: true, description: 'Include stack trace in error' },
          },
          required: ['errorMessage'],
        },
        inputSchema: {
          type: 'object',
          description: 'Additional error context data',
        },
        outputSchema: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                type: { type: 'string' },
                statusCode: { type: 'number' },
                context: { type: 'object' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'on_error',
        displayName: 'On Error',
        description: 'Execute a separate error handling flow when errors occur',
        actionType: 'system',
        category: 'error_handling',
        icon: 'AlertOctagon',
        color: '#ef4444',
        configSchema: {
          type: 'object',
          properties: {
            errorTypes: {
              type: 'array',
              description: 'Error types to catch (empty = catch all)',
              items: { type: 'string' },
              default: [],
            },
            continueOnError: { type: 'boolean', default: false, description: 'Continue main flow after error handling' },
            logError: { type: 'boolean', default: true, description: 'Log error to activity logs' },
            notifyOnError: { type: 'boolean', default: false, description: 'Send notification on error' },
          },
        },
        inputSchema: {
          type: 'object',
          description: 'Input data when error occurs',
        },
        outputSchema: {
          type: 'object',
          properties: {
            error: { description: 'The error that was caught' },
            handled: { type: 'boolean', description: 'Whether error was handled' },
            originalInput: { description: 'Input data when error occurred' },
            timestamp: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          maxBranches: 2, // Error handling flow (error + no-error)
          branchLabels: ['error', 'no-error'],
          isErrorHandler: true,
        },
      },
      {
        name: 'retry',
        displayName: 'Retry',
        description: 'Retry an action with exponential backoff on failure',
        actionType: 'system',
        category: 'error_handling',
        icon: 'RefreshCw',
        color: '#10b981',
        configSchema: {
          type: 'object',
          properties: {
            maxAttempts: { type: 'number', default: 3, description: 'Maximum retry attempts' },
            initialDelay: { type: 'number', default: 1000, description: 'Initial delay in ms' },
            maxDelay: { type: 'number', default: 60000, description: 'Maximum delay in ms' },
            backoffMultiplier: { type: 'number', default: 2, description: 'Exponential backoff multiplier' },
            retryOnErrors: {
              type: 'array',
              description: 'Error types to retry on',
              items: { type: 'string' },
              default: ['NetworkError', 'TimeoutError', 'ServiceUnavailable'],
            },
          },
        },
        inputSchema: {
          type: 'object',
          description: 'Input data for action to retry',
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            attempts: { type: 'number', description: 'Number of attempts made' },
            result: { description: 'Result from successful attempt' },
            lastError: { description: 'Last error if all attempts failed' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          maxBranches: 1, // Action to retry
        },
      },
      {
        name: 'call_process',
        displayName: 'Call Process',
        description: 'Execute another process as a sub-process',
        actionType: 'system',
        category: 'control_flow',
        icon: 'Workflow',
        color: '#6366f1',
        configSchema: {
          type: 'object',
          properties: {
            processId: { type: 'string', description: 'ID of the process to call' },
            processName: { type: 'string', description: 'Name of the process to call (for display)' },
            waitForCompletion: { type: 'boolean', default: true, description: 'Wait for sub-process to complete' },
            inheritContext: { type: 'boolean', default: true, description: 'Pass current context to sub-process' },
            timeoutMs: { type: 'number', default: 300000, description: 'Timeout in milliseconds (5 min default)' },
          },
          required: ['processId'],
        },
        inputSchema: {
          type: 'object',
          description: 'Input data to pass to the sub-process',
        },
        outputSchema: {
          type: 'object',
          properties: {
            executionId: { type: 'string', description: 'Execution ID of the sub-process' },
            status: { type: 'string', description: 'Status of the sub-process execution' },
            result: { description: 'Result from the sub-process' },
            startedAt: { type: 'string' },
            completedAt: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          maxBranches: 1,
        },
      },
      {
        name: 'transform',
        displayName: 'Transform Data',
        description: 'Transform data using mappings or scripts',
        actionType: 'system',
        category: 'data',
        icon: 'RefreshCw',
        color: '#06b6d4',
        configSchema: {
          type: 'object',
          properties: {
            transformType: { type: 'string', enum: ['mapping', 'script', 'jsonpath'], default: 'mapping' },
            mapping: { type: 'object', description: 'Field mapping configuration' },
            script: { type: 'string', description: 'Transformation script' },
          },
        },
        inputSchema: {
          description: 'Data to transform',
        },
        outputSchema: {
          description: 'Transformed data',
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'for_each',
        displayName: 'For Each',
        description: 'Iterate over an array and execute an action for each item',
        actionType: 'system',
        category: 'control_flow',
        icon: 'RotateCw',
        color: '#8b5cf6',
        configSchema: {
          type: 'object',
          properties: {
            array: { type: 'string', description: 'Path to array property in input' },
            batchSize: { type: 'number', default: 1, description: 'Number of items to process in parallel' },
            stopOnError: { type: 'boolean', default: false, description: 'Stop if any iteration fails' },
            subAction: { type: 'object', description: 'Action to execute for each item' },
          },
          required: ['array'],
        },
        inputSchema: {
          type: 'object',
          properties: {
            items: { type: 'array', description: 'Array of items to iterate over' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            processed: { type: 'number' },
            results: { type: 'array' },
            errors: { type: 'array' },
            hasErrors: { type: 'boolean' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'while',
        displayName: 'While Loop',
        description: 'Execute an action repeatedly while a condition is true',
        actionType: 'system',
        category: 'control_flow',
        icon: 'Repeat',
        color: '#8b5cf6',
        configSchema: {
          type: 'object',
          properties: {
            condition: { type: 'string', description: 'JavaScript condition to evaluate' },
            maxIterations: { type: 'number', default: 100, description: 'Maximum iterations' },
            delayBetweenIterations: { type: 'number', default: 0, description: 'Delay in ms between iterations' },
            subAction: { type: 'object', description: 'Action to execute in each iteration' },
          },
          required: ['condition'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            iterations: { type: 'number' },
            results: { type: 'array' },
            completed: { type: 'boolean' },
            maxIterationsReached: { type: 'boolean' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'parallel',
        displayName: 'Parallel Execution',
        description: 'Execute multiple actions simultaneously',
        actionType: 'system',
        category: 'control_flow',
        icon: 'Layers',
        color: '#8b5cf6',
        configSchema: {
          type: 'object',
          properties: {
            actions: { type: 'array', description: 'Array of actions to execute in parallel' },
            failFast: { type: 'boolean', default: false, description: 'Stop all on first error' },
            timeout: { type: 'number', default: 30000, description: 'Timeout per action in ms' },
          },
          required: ['actions'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            successful: { type: 'number' },
            failed: { type: 'number' },
            results: { type: 'array' },
            errors: { type: 'array' },
            duration: { type: 'number' },
            hasErrors: { type: 'boolean' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'delay',
        displayName: 'Delay',
        description: 'Pause workflow execution for a specified duration or until a condition is met',
        actionType: 'system',
        category: 'control_flow',
        icon: 'Clock',
        color: '#f59e0b',
        configSchema: {
          type: 'object',
          properties: {
            delayType: { 
              type: 'string', 
              enum: ['fixed', 'dynamic', 'conditional', 'until'],
              default: 'fixed',
              description: 'Type of delay to apply'
            },
            // Fixed Delay
            delayAmount: { 
              type: 'number', 
              description: 'Amount of time to delay (for fixed delay)' 
            },
            timeUnits: { 
              type: 'string', 
              enum: ['seconds', 'minutes', 'hours', 'days'],
              default: 'seconds',
              description: 'Time units for delay amount' 
            },
            // Dynamic Delay
            durationExpression: { 
              type: 'string', 
              description: 'Expression to calculate delay duration (for dynamic delay)' 
            },
            maxWaitTime: { 
              type: 'string', 
              description: 'Maximum time to wait (e.g., "24 hours")' 
            },
            // Conditional Delay
            conditions: {
              type: 'array',
              description: 'Array of condition groups for conditional delay (uses ConditionalEditor)',
            },
            checkInterval: { 
              type: 'number', 
              default: 60,
              description: 'How often to check conditions (in seconds)' 
            },
            // Until Specific Date/Time
            targetDateTime: { 
              type: 'string', 
              description: 'ISO 8601 date/time string or expression' 
            },
            timeZone: { 
              type: 'string', 
              default: 'UTC',
              description: 'Time zone for date/time' 
            },
            // General
            title: { type: 'string', description: 'Display title' },
            description: { type: 'string', description: 'Description of delay purpose' },
            status: { 
              type: 'string', 
              enum: ['active', 'inactive'],
              default: 'active'
            },
          },
          required: ['delayType'],
        },
        inputSchema: {
          type: 'object',
          description: 'Input data that may be used in expressions',
        },
        outputSchema: {
          type: 'object',
          properties: {
            delayedFor: { type: 'number', description: 'Actual delay duration in milliseconds' },
            completedAt: { type: 'string', description: 'ISO timestamp when delay completed' },
            delayType: { type: 'string', description: 'Type of delay that was applied' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          async: true,
        },
      },
      {
        name: 'validate',
        displayName: 'Validate Data',
        description: 'Validate data against a JSON schema',
        actionType: 'system',
        category: 'data',
        icon: 'CheckCircle',
        color: '#10b981',
        configSchema: {
          type: 'object',
          properties: {
            schema: { type: 'object', description: 'JSON Schema to validate against' },
            dataPath: { type: 'string', description: 'Path to data to validate (optional)' },
            throwOnError: { type: 'boolean', default: false, description: 'Throw error if validation fails' },
          },
          required: ['schema'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            errors: { type: 'array' },
            data: { description: 'Validated data' },
            schema: { type: 'object' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'merge',
        displayName: 'Merge Data',
        description: 'Merge multiple data sources into one',
        actionType: 'system',
        category: 'data',
        icon: 'Merge',
        color: '#10b981',
        configSchema: {
          type: 'object',
          properties: {
            sources: { type: 'array', description: 'Array of paths to data sources' },
            strategy: { type: 'string', enum: ['shallow', 'deep', 'concat', 'override'], default: 'deep' },
            arrayMergeStrategy: { type: 'string', enum: ['concat', 'replace', 'unique'], default: 'concat' },
          },
          required: ['sources'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { description: 'Merged data' },
            sourcesCount: { type: 'number' },
            strategy: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'script',
        displayName: 'Run Script',
        description: 'Execute custom JavaScript in a sandboxed environment',
        actionType: 'system',
        category: 'script',
        icon: 'Code',
        color: '#f59e0b',
        configSchema: {
          type: 'object',
          properties: {
            script: { type: 'string', description: 'JavaScript code to execute' },
            timeout: { type: 'number', default: 5000, description: 'Execution timeout in ms' },
            allowAsync: { type: 'boolean', default: true, description: 'Allow async/await' },
            sandbox: { type: 'object', description: 'Additional sandbox variables' },
          },
          required: ['script'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { description: 'Script result' },
            executed: { type: 'boolean' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'set_variable',
        displayName: 'Set Variable',
        description: 'Set a variable in the execution context',
        actionType: 'system',
        category: 'data',
        icon: 'Box',
        color: '#06b6d4',
        configSchema: {
          type: 'object',
          properties: {
            variableName: { type: 'string', description: 'Name of the variable to set' },
            value: { description: 'Value to set (can reference {{input.field}})' },
            scope: { type: 'string', enum: ['local', 'global'], default: 'local', description: 'Variable scope' },
          },
          required: ['variableName'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            variableName: { type: 'string' },
            value: { description: 'Set value' },
            success: { type: 'boolean' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'set_payload',
        displayName: 'Set Payload',
        description: 'Set the payload data for subsequent actions',
        actionType: 'system',
        category: 'data',
        icon: 'Database',
        color: '#06b6d4',
        configSchema: {
          type: 'object',
          properties: {
            payload: { description: 'Payload data (can be static or reference {{input.field}})' },
            merge: { type: 'boolean', default: false, description: 'Merge with existing payload' },
          },
          required: ['payload'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            payload: { description: 'New payload' },
            merged: { type: 'boolean' },
            success: { type: 'boolean' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'log',
        displayName: 'Log',
        description: 'Log a message to activity logs',
        actionType: 'system',
        category: 'control_flow',
        icon: 'FileText',
        color: '#8b5cf6',
        configSchema: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'], default: 'info', description: 'Log level' },
            message: { type: 'string', description: 'Log message (can reference {{input.field}})' },
            metadata: { type: 'object', description: 'Additional metadata to log' },
          },
          required: ['message'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            logId: { type: 'number' },
            timestamp: { type: 'string' },
            level: { type: 'string' },
            message: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          async: true, // Log is async
        },
      },
      {
        name: 'notify',
        displayName: 'Notify',
        description: 'Send notification to users (internal or via API)',
        actionType: 'system',
        category: 'control_flow',
        icon: 'Bell',
        color: '#f59e0b',
        configSchema: {
          type: 'object',
          properties: {
            notificationType: { 
              type: 'string', 
              enum: ['internal', 'api'], 
              default: 'internal',
              description: 'Notification type: internal (in-app) or external (via API connector)' 
            },
            recipients: {
              type: 'object',
              properties: {
                self: { type: 'boolean', default: false, description: 'Notify current user' },
                users: { type: 'array', items: { type: 'number' }, description: 'User IDs to notify' },
                admins: { type: 'boolean', default: false, description: 'Notify all admins' },
              },
            },
            message: { type: 'string', description: 'Notification message' },
            title: { type: 'string', description: 'Notification title' },
            link: { type: 'string', description: 'Optional link/URL for the notification' },
            connectorId: { 
              type: 'number', 
              description: 'Connector ID for API-based notifications (required if notificationType=api)' 
            },
            priority: { 
              type: 'string', 
              enum: ['low', 'normal', 'high'], 
              default: 'normal',
              description: 'Notification priority' 
            },
          },
          required: ['recipients', 'message'],
        },
        inputSchema: {
          type: 'object',
          description: 'Input data can be referenced in message using {{input.field}}',
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            notificationIds: { type: 'array', items: { type: 'number' } },
            recipientCount: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {
          async: true, // Notify is async
        },
      },
      {
        name: 'redis_publish',
        displayName: 'Redis Publish',
        description: 'Publish a message to a Redis channel',
        actionType: 'system',
        category: 'messaging',
        icon: 'Send',
        color: '#ef4444',
        configSchema: {
          type: 'object',
          properties: {
            connectorId: { type: 'number', description: 'Redis connector ID' },
            channel: { type: 'string', description: 'Redis channel name' },
            message: { description: 'Message to publish (will be JSON stringified if object)' },
          },
          required: ['connectorId', 'channel', 'message'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            channel: { type: 'string' },
            subscribersCount: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
      {
        name: 'redis_subscribe',
        displayName: 'Redis Subscribe',
        description: 'Subscribe to a Redis channel and wait for a message',
        actionType: 'system',
        category: 'messaging',
        icon: 'Inbox',
        color: '#ef4444',
        configSchema: {
          type: 'object',
          properties: {
            connectorId: { type: 'number', description: 'Redis connector ID' },
            channel: { type: 'string', description: 'Redis channel name' },
            timeoutMs: { type: 'number', default: 5000, description: 'Timeout in milliseconds to wait for message' },
            parseJson: { type: 'boolean', default: true, description: 'Auto-parse JSON messages' },
          },
          required: ['connectorId', 'channel'],
        },
        inputSchema: {
          type: 'object',
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            channel: { type: 'string' },
            message: { description: 'Received message' },
            timestamp: { type: 'string' },
          },
        },
        executorType: 'builtin',
        executorConfig: {},
      },
    ];

    // Create or update system actions
    for (const actionData of systemActions) {
      const existing = await prisma.action.findUnique({
        where: { name: actionData.name },
      });

      if (existing) {
        await prisma.action.update({
          where: { name: actionData.name },
          data: {
            ...actionData,
            isSystem: true,
            isActive: true,
            createdBy: systemUser.id,
          },
        });
        logger.info(`Updated system action: ${actionData.name}`);
      } else {
        await prisma.action.create({
          data: {
            ...actionData,
            isSystem: true,
            isActive: true,
            createdBy: systemUser.id,
          },
        });
        logger.info(`Created system action: ${actionData.name}`);
      }
    }

    // Create permissions if they don't exist
    const permissions = [
      { name: 'actions.view', description: 'View actions', category: 'actions' },
      { name: 'actions.create', description: 'Create actions', category: 'actions' },
      { name: 'actions.edit_own', description: 'Edit own actions', category: 'actions' },
      { name: 'actions.edit_all', description: 'Edit all actions', category: 'actions' },
      { name: 'actions.delete_own', description: 'Delete own actions', category: 'actions' },
      { name: 'actions.delete_all', description: 'Delete all actions', category: 'actions' },
      { name: 'actions.share', description: 'Share actions', category: 'actions' },
      { name: 'actions.execute', description: 'Execute actions', category: 'actions' },
      
      { name: 'processes.view', description: 'View processes', category: 'processes' },
      { name: 'processes.create', description: 'Create processes', category: 'processes' },
      { name: 'processes.edit_own', description: 'Edit own processes', category: 'processes' },
      { name: 'processes.edit_all', description: 'Edit all processes', category: 'processes' },
      { name: 'processes.delete_own', description: 'Delete own processes', category: 'processes' },
      { name: 'processes.delete_all', description: 'Delete all processes', category: 'processes' },
      { name: 'processes.share', description: 'Share processes', category: 'processes' },
      { name: 'processes.execute', description: 'Execute processes', category: 'processes' },
      
      { name: 'executions.view_own', description: 'View own executions', category: 'executions' },
      { name: 'executions.view_all', description: 'View all executions', category: 'executions' },
      { name: 'executions.retry', description: 'Retry executions', category: 'executions' },
      { name: 'executions.cancel', description: 'Cancel executions', category: 'executions' },
      
      { name: 'connectors.view', description: 'View connectors', category: 'connectors' },
      { name: 'connectors.create', description: 'Create connectors', category: 'connectors' },
      { name: 'connectors.edit_own', description: 'Edit own connectors', category: 'connectors' },
      { name: 'connectors.edit_all', description: 'Edit all connectors', category: 'connectors' },
      { name: 'connectors.delete_own', description: 'Delete own connectors', category: 'connectors' },
      { name: 'connectors.delete_all', description: 'Delete all connectors', category: 'connectors' },
      
      { name: 'stores.view', description: 'View stores', category: 'stores' },
      { name: 'stores.create', description: 'Create stores', category: 'stores' },
      { name: 'stores.edit', description: 'Edit stores', category: 'stores' },
      { name: 'stores.delete', description: 'Delete stores', category: 'stores' },
    ];

    for (const permData of permissions) {
      const existing = await prisma.permission.findUnique({
        where: { name: permData.name },
      });

      if (!existing) {
        await prisma.permission.create({ data: permData });
        logger.info(`Created permission: ${permData.name}`);
      }
    }

    // Assign all action system permissions to admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    if (adminRole) {
      for (const permData of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permData.name },
        });

        if (permission) {
          const existing = await prisma.rolePermission.findUnique({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permission.id,
              },
            },
          });

          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: adminRole.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }
      logger.info('Assigned all action permissions to admin role');
    }

    // Assign some permissions to user role
    const userRole = await prisma.role.findUnique({
      where: { name: 'user' },
    });

    if (userRole) {
      const userPermissions = [
        'actions.view', 'actions.create', 'actions.edit_own', 'actions.delete_own', 'actions.share', 'actions.execute',
        'processes.view', 'processes.create', 'processes.edit_own', 'processes.delete_own', 'processes.share', 'processes.execute',
        'executions.view_own', 'executions.retry', 'executions.cancel',
        'connectors.view', 'connectors.create', 'connectors.edit_own', 'connectors.delete_own',
        'stores.view', 'stores.create', 'stores.edit', 'stores.delete',
      ];

      for (const permName of userPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName },
        });

        if (permission) {
          const existing = await prisma.rolePermission.findUnique({
            where: {
              roleId_permissionId: {
                roleId: userRole.id,
                permissionId: permission.id,
              },
            },
          });

          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: userRole.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }
      logger.info('Assigned action permissions to user role');
    }

    logger.info('System actions and permissions seeded successfully!');
  } catch (error: any) {
    logger.error('Error seeding system actions:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSystemActions()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

