import React, { useRef, useEffect, useState } from 'react';
import { Bot, Zap, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatInterface } from '@/components/ChatInterface';
import { UploadedDoc, Message } from '@/pages/Index';

interface MainContentProps {
  uploadedDocs: UploadedDoc[];
  activeDocIndex: number | null;
  showChat: boolean;
  onStartChat: (docIndex: number) => void;
  onBackToHome: () => void;
  onAddMessage: (docIndex: number, message: Message) => void;
  combinedSummary: string;
  loadingCombinedSummary: boolean;
  uploading: boolean;
  spinnerMessage: string;
  isHome: boolean;
}

const Spinner = ({ message }: { message: string }) => (
  <div className="flex flex-1 items-center justify-center h-full w-full">
    <span className="inline-block align-middle">
      <svg className="animate-spin h-8 w-8 text-muted-foreground mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span className="text-base text-muted-foreground">{message}</span>
    </span>
  </div>
);

export const MainContent: React.FC<MainContentProps> = ({
  uploadedDocs,
  activeDocIndex,
  showChat,
  onStartChat,
  onBackToHome,
  onAddMessage,
  combinedSummary,
  loadingCombinedSummary,
  uploading,
  spinnerMessage,
  isHome
}) => {
  const activeDoc = activeDocIndex !== null ? uploadedDocs[activeDocIndex] : null;
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDoc?.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeDoc) return;
    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    onAddMessage(activeDocIndex!, userMessage);
    setInputValue('');
    try {
      // Always use /chat-multi for Q&A
      const session_ids = uploadedDocs.map(doc => doc.sessionId).filter(Boolean);
      const res = await fetch('http://localhost:8000/chat-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_ids, question: userMessage.content })
      });
      if (!res.ok) throw new Error('Failed to get answer');
      const data = await res.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.answer,
        timestamp: new Date(),
      };
      onAddMessage(activeDocIndex!, aiMessage);
    } catch (error) {
      // Optionally show a toast or error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if ((uploading || loadingCombinedSummary) && spinnerMessage) {
    return <Spinner message={spinnerMessage} />;
  }

  if (showChat && activeDoc) {
    return (
      <main className="flex-1 flex flex-col h-full w-full">
        <div className="border-b border-border p-3 bg-background">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Chat Interface</h1>
            <Button variant="outline" onClick={onBackToHome} size="sm">
              Back to Home
            </Button>
          </div>
        </div>
        {/* Combined Summary Section */}
        {combinedSummary && (
          <div className="bg-muted border-b border-border px-4 py-2 text-sm text-muted-foreground">
            <strong>Summary:</strong> {combinedSummary}
          </div>
        )}
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-2 pb-24">
            <ChatInterface
              file={activeDoc.file}
              sessionId={activeDoc.sessionId}
              messages={activeDoc.messages}
              onAddMessage={(msg) => onAddMessage(activeDocIndex!, msg)}
            />
            <div ref={messagesEndRef} />
          </div>
          {/* Sticky Chat Input Box */}
          <div className="absolute bottom-0 left-0 w-full bg-background border-t border-border p-2 flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full w-full items-center justify-center px-2 sm:px-4 py-2">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center w-full p-2 sm:p-4 lg:p-8">
        <div className="w-full text-center space-y-5">
          {/* Header Section */}
          <div>
            <div className="bg-accent/10 p-3 rounded-full w-14 h-14 mx-auto mb-4 flex items-center justify-center">
              <Bot className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Chat with your PDF
            </h1>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Upload a PDF document to start asking questions about its content. 
              The AI will analyze the document and provide relevant answers.
            </p>
          </div>
          {/* Analysis Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 w-full">
            <div className="text-center p-4 border border-border rounded-lg hover:border-accent transition-colors w-full">
              <Zap className="h-6 w-6 text-accent mx-auto mb-2" />
              <h3 className="font-semibold text-base mb-1">Quick Analysis</h3>
              <p className="text-xs text-muted-foreground">
                Get a summary and key insights from your document
              </p>
            </div>
            <div className="text-center p-4 border border-border rounded-lg hover:border-accent transition-colors w-full">
              <Search className="h-6 w-6 text-accent mx-auto mb-2" />
              <h3 className="font-semibold text-base mb-1">Deep Search</h3>
              <p className="text-xs text-muted-foreground">
                Find specific information with precise queries
              </p>
            </div>
          </div>
          {/* Start Chat Button for each uploaded doc */}
          {uploadedDocs.length > 0 && !isHome && (
            <div className="mb-5 space-y-2 w-full">
              {uploadedDocs.map((doc, idx) => (
                <Button key={doc.sessionId} onClick={() => onStartChat(idx)} size="lg" className="px-6 w-full text-base">
                  Chat with: {doc.file.name}
                  <Send className="h-4 w-4 ml-2" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};