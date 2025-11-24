import logger from '../../utils/logger';

export class MergeAction {
  async execute(config: any, input: any, context: any): Promise<any> {
    try {
      const {
        sources = [],
        strategy = 'deep', // 'shallow', 'deep', 'concat', 'override'
        arrayMergeStrategy = 'concat', // 'concat', 'replace', 'unique'
      } = config;

      if (!Array.isArray(sources) || sources.length === 0) {
        throw new Error('MERGE requires at least one source');
      }

      logger.info(`MERGE: Merging ${sources.length} sources with strategy: ${strategy}`);

      // Extract source data
      const sourceData = sources.map((sourcePath: string) => {
        return this.extractData(input, sourcePath, context);
      });

      // Merge based on strategy
      let result;
      switch (strategy) {
        case 'shallow':
          result = this.shallowMerge(sourceData);
          break;
        case 'deep':
          result = this.deepMerge(sourceData, arrayMergeStrategy);
          break;
        case 'concat':
          result = this.concatArrays(sourceData);
          break;
        case 'override':
          result = this.overrideMerge(sourceData);
          break;
        default:
          throw new Error(`Unknown merge strategy: ${strategy}`);
      }

      return {
        result,
        sourcesCount: sources.length,
        strategy,
      };
    } catch (error: any) {
      logger.error('MERGE action error:', error);
      throw error;
    }
  }

  private extractData(input: any, path: string, context: any): any {
    // Handle special paths
    if (path === '$input') return input;
    if (path === '$context') return context;
    if (path.startsWith('$context.')) {
      const contextPath = path.substring('$context.'.length);
      return this.getNestedValue(context, contextPath);
    }
    if (path.startsWith('$input.')) {
      const inputPath = path.substring('$input.'.length);
      return this.getNestedValue(input, inputPath);
    }

    return this.getNestedValue(input, path);
  }

  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  private shallowMerge(sources: any[]): any {
    return Object.assign({}, ...sources);
  }

  private deepMerge(sources: any[], arrayStrategy: string): any {
    const result: any = {};

    for (const source of sources) {
      this.deepMergeInto(result, source, arrayStrategy);
    }

    return result;
  }

  private deepMergeInto(target: any, source: any, arrayStrategy: string): void {
    if (!source || typeof source !== 'object') {
      return;
    }

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (Array.isArray(sourceValue)) {
          if (arrayStrategy === 'concat') {
            target[key] = Array.isArray(targetValue)
              ? targetValue.concat(sourceValue)
              : sourceValue;
          } else if (arrayStrategy === 'unique') {
            const combined = Array.isArray(targetValue)
              ? targetValue.concat(sourceValue)
              : sourceValue;
            target[key] = [...new Set(combined)];
          } else {
            target[key] = sourceValue;
          }
        } else if (sourceValue && typeof sourceValue === 'object') {
          target[key] = target[key] || {};
          this.deepMergeInto(target[key], sourceValue, arrayStrategy);
        } else {
          target[key] = sourceValue;
        }
      }
    }
  }

  private concatArrays(sources: any[]): any[] {
    return sources.reduce((acc, source) => {
      if (Array.isArray(source)) {
        return acc.concat(source);
      }
      return acc.concat([source]);
    }, []);
  }

  private overrideMerge(sources: any[]): any {
    // Last source wins
    return sources[sources.length - 1];
  }
}

