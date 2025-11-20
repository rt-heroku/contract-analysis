import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader, Copy, Check, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  tablesUsed?: string[];
  timestamp: Date;
}

interface AISQLGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSQL: (prompt: string, history: Message[]) => Promise<{ sql: string; explanation: string; tablesUsed: string[] }>;
  onInsertSQL: (sql: string) => void;
}

export const AISQLGeneratorDialog: React.FC<AISQLGeneratorDialogProps> = ({
  isOpen,
  onClose,
  onGenerateSQL,
  onInsertSQL,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      // Call AI with conversation history
      const result = await onGenerateSQL(userMessage.content, messages);

      // Check if response contains SQL or is a question/clarification
      const isSQLResponse = result.sql && result.sql.trim().length > 0;

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.explanation,
        sql: isSQLResponse ? result.sql : undefined,
        tablesUsed: result.tablesUsed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Error: ${err.response?.data?.error || err.message || 'Failed to generate SQL'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = (sql: string) => {
    onInsertSQL(sql);
    handleClose();
  };

  const handleClose = () => {
    setPrompt('');
    setMessages([]);
    setLoading(false);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">AI SQL Assistant</h2>
            {messages.length > 0 && (
              <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            ✕
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  AI SQL Assistant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Ask me to generate SQL queries in natural language. I can help you:
                </p>
                <ul className="text-xs text-left text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Create SELECT queries with JOINs and filters</li>
                  <li>• Generate aggregation and GROUP BY queries</li>
                  <li>• Build complex WHERE conditions</li>
                  <li>• Answer questions about your database schema</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white rounded-l-lg rounded-tr-lg'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg rounded-tl-lg'
                  } p-4 shadow-sm`}
                >
                  {/* Message content */}
                  <p
                    className={`text-sm whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'text-white'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {message.content}
                  </p>

                  {/* Tables used */}
                  {message.tablesUsed && message.tablesUsed.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Tables Used:
                      </span>
                      {message.tablesUsed.map((table) => (
                        <Badge key={table} variant="info">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* SQL code block */}
                  {message.sql && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Generated SQL:
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopySQL(message.sql!)}
                            className="gap-1 text-xs h-7"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleInsert(message.sql!)}
                            className="gap-1 text-xs h-7"
                          >
                            <Sparkles className="w-3 h-3" />
                            Insert
                          </Button>
                        </div>
                      </div>
                      <pre className="p-3 bg-gray-900 dark:bg-black border border-gray-700 rounded-lg overflow-x-auto">
                        <code className="text-xs text-gray-100 font-mono">{message.sql}</code>
                      </pre>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs mt-2 opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg rounded-tl-lg p-4 shadow-sm">
                <Loader className="w-5 h-5 animate-spin text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me to generate SQL... (e.g., 'Show all customers with orders in the last 7 days')"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!prompt.trim() || loading}
              className="gap-2 px-6 self-end"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

