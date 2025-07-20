import React, { useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: string[];
}

interface ChatInterfaceProps {
  file: File;
  sessionId: string;
  messages: Message[];
  onAddMessage: (msg: Message) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ file, sessionId, messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-border p-4 bg-background">
        <h2 className="text-lg font-semibold text-foreground">Chat with Document</h2>
      </div>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-chat-background space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Bot className="h-12 w-12 mx-auto mb-4 text-accent" />
            <h3 className="text-lg font-medium mb-2">Ready to help!</h3>
            <p className="text-sm">
              {file 
                ? 'Ask me anything about your uploaded document.' 
                : 'Upload a PDF document to start chatting.'}
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-chat-user-bubble text-white ml-12'
                  : 'bg-chat-ai-bubble border border-border mr-12'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <Bot className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-foreground'}`}>
                    {message.content}
                  </p>
                  {message.sources && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source, index) => (
                          <span
                            key={index}
                            className="inline-block bg-muted text-muted-foreground text-xs px-2 py-1 rounded"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {message.type === 'user' && (
                  <User className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                )}
              </div>
              <p className={`text-xs mt-2 ${
                message.type === 'user' ? 'text-blue-100' : 'text-chat-timestamp'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};