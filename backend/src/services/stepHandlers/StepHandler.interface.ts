/**
 * Step Handler Interface
 * 
 * All step handlers must implement this interface
 */
export interface StepHandler {
  /**
   * Execute the step
   * @param stepConfig - Step-specific configuration
   * @param inputData - Input data from previous step or user
   * @param context - Full execution context
   * @param userId - User executing the workflow
   * @returns Step output data
   */
  execute(stepConfig: any, inputData: any, context: any, userId: number): Promise<any>;

  /**
   * Whether this step requires user input
   */
  requiresUserInput(): boolean;

  /**
   * Get the modal component name for user interaction (if any)
   */
  getModalComponent(): string | null;
}

