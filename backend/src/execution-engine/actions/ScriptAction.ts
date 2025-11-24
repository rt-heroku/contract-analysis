import { VM } from 'vm2';
import logger from '../../utils/logger';

export class ScriptAction {
  async execute(config: any, input: any, context: any): Promise<any> {
    try {
      const {
        script,
        timeout = 5000,
        sandbox = {},
        allowAsync = true,
      } = config;

      if (!script) {
        throw new Error('SCRIPT requires a script to execute');
      }

      logger.info('SCRIPT: Executing sandboxed JavaScript');

      // Create VM instance with security constraints
      const vm = new VM({
        timeout,
        sandbox: {
          input,
          context,
          console: {
            log: (...args: any[]) => logger.info('Script log:', ...args),
            error: (...args: any[]) => logger.error('Script error:', ...args),
            warn: (...args: any[]) => logger.warn('Script warn:', ...args),
          },
          JSON,
          Math,
          Date,
          Array,
          Object,
          String,
          Number,
          Boolean,
          parseInt,
          parseFloat,
          isNaN,
          isFinite,
          ...sandbox,
        },
      });

      // Wrap script to support both sync and async
      const wrappedScript = allowAsync
        ? `
          (async function() {
            ${script}
          })();
        `
        : `
          (function() {
            ${script}
          })();
        `;

      // Execute script
      const result = await vm.run(wrappedScript);

      logger.info('SCRIPT: Execution completed successfully');

      return {
        result,
        executed: true,
      };
    } catch (error: any) {
      logger.error('SCRIPT action error:', error);
      
      // Sanitize error message (don't expose internal details)
      const sanitizedError = {
        message: error.message || 'Script execution failed',
        type: error.name || 'ScriptError',
      };

      throw new Error(JSON.stringify(sanitizedError));
    }
  }
}

