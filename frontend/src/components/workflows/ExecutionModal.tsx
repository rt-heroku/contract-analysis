import React, { useState } from 'react';
import { X, CheckCircle, Circle, AlertCircle, Loader, XCircle } from 'lucide-react';
import { getStepType } from '../../config/stepTypes';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  execution: any;
  onResumeWithInput: (userInput: any) => void;
  onCancel: () => void;
}

/**
 * Execution Modal
 * 
 * Shows workflow execution progress and handles user input
 */
export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  onClose,
  execution,
  onResumeWithInput,
  onCancel,
}) => {
  const [userInput, setUserInput] = useState<any>({});

  if (!isOpen || !execution) return null;

  const isWaitingForUser = execution.status === 'waiting_user';
  const isCompleted = execution.status === 'completed';
  const isFailed = execution.status === 'failed';
  const isRunning = execution.status === 'running';

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'waiting_user':
        return <Circle className="w-5 h-5 text-orange-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const handleSubmitUserInput = () => {
    onResumeWithInput(userInput);
    setUserInput({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Workflow Execution
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {execution.workflow?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Banner */}
          <div className={`mb-6 p-4 rounded-lg ${
            isCompleted ? 'bg-green-50 border border-green-200' :
            isFailed ? 'bg-red-50 border border-red-200' :
            isWaitingForUser ? 'bg-orange-50 border border-orange-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              {isCompleted && <CheckCircle className="w-6 h-6 text-green-600" />}
              {isFailed && <AlertCircle className="w-6 h-6 text-red-600" />}
              {isWaitingForUser && <Circle className="w-6 h-6 text-orange-600" />}
              {isRunning && <Loader className="w-6 h-6 text-blue-600 animate-spin" />}
              <div>
                <div className="font-medium text-gray-900">
                  {isCompleted && 'Execution Completed'}
                  {isFailed && 'Execution Failed'}
                  {isWaitingForUser && 'Waiting for User Input'}
                  {isRunning && 'Execution in Progress'}
                </div>
                {execution.errorMessage && (
                  <div className="text-sm text-red-600 mt-1">{execution.errorMessage}</div>
                )}
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {execution.stepExecutions?.map((stepExec: any) => {
              const stepTypeConfig = getStepType(stepExec.step.stepType);
              if (!stepTypeConfig) return null;

              const Icon = stepTypeConfig.icon;

              return (
                <div
                  key={stepExec.id}
                  className={`p-4 rounded-lg border ${
                    stepExec.status === 'waiting_user' ? 'border-orange-300 bg-orange-50' :
                    stepExec.status === 'running' ? 'border-blue-300 bg-blue-50' :
                    stepExec.status === 'completed' ? 'border-green-200 bg-green-50' :
                    stepExec.status === 'failed' ? 'border-red-200 bg-red-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    {getStepIcon(stepExec.status)}

                    {/* Step Number */}
                    <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-semibold text-gray-700 border border-gray-300">
                      {stepExec.stepOrder}
                    </div>

                    {/* Step Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 ${stepTypeConfig.color} rounded flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Step Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{stepExec.step.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {stepExec.status === 'pending' && 'Pending...'}
                        {stepExec.status === 'running' && 'Running...'}
                        {stepExec.status === 'completed' && 'Completed'}
                        {stepExec.status === 'failed' && `Failed: ${stepExec.errorMessage}`}
                        {stepExec.status === 'waiting_user' && 'Waiting for your input'}
                      </div>
                      {stepExec.durationMs && (
                        <div className="text-xs text-gray-500 mt-1">
                          Duration: {(stepExec.durationMs / 1000).toFixed(2)}s
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Input Form */}
                  {stepExec.status === 'waiting_user' && (
                    <div className="mt-4 pt-4 border-t border-orange-200">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Please provide input to continue:
                        </label>
                        {/* Simple text input for now - can be customized per step type */}
                        <textarea
                          value={userInput.value || ''}
                          onChange={(e) => setUserInput({ value: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your input here..."
                        />
                      </div>
                      <button
                        onClick={handleSubmitUserInput}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Continue Workflow
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Execution Details */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Execution ID:</span>
                <span className="font-mono text-gray-900">{execution.executionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-gray-900">{execution.status}</span>
              </div>
              {execution.startedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span className="text-gray-900">
                    {new Date(execution.startedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {execution.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="text-gray-900">
                    {new Date(execution.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {execution.durationMs && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Duration:</span>
                  <span className="text-gray-900">
                    {(execution.durationMs / 1000).toFixed(2)}s
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          {isRunning && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Cancel Execution
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isRunning && !isWaitingForUser}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isCompleted || isFailed ? 'Close' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

