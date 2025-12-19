import { StepHandler } from './StepHandler.interface';
import { FileUploadHandler } from './FileUploadHandler';
import { IdpProcessHandler } from './IdpProcessHandler';
import { ApiCallHandler } from './ApiCallHandler';
import { ReviewHandler } from './ReviewHandler';
import { AnalyzeHandler } from './AnalyzeHandler';
import { StoreHandler } from './StoreHandler';

/**
 * Step Handler Factory
 * 
 * Returns the appropriate handler for each step type
 */
export class StepHandlerFactory {
  private static handlers: Map<string, StepHandler> = new Map([
    ['file_upload', new FileUploadHandler()],
    ['idp_process', new IdpProcessHandler()],
    ['api_call', new ApiCallHandler()],
    ['review', new ReviewHandler()],
    ['analyze', new AnalyzeHandler()],
    ['store', new StoreHandler()],
  ]);

  static getHandler(stepType: string): StepHandler {
    const handler = this.handlers.get(stepType);
    if (!handler) {
      throw new Error(`Unknown step type: ${stepType}`);
    }
    return handler;
  }

  static registerHandler(stepType: string, handler: StepHandler) {
    this.handlers.set(stepType, handler);
  }
}





