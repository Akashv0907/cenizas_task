import React, { useState } from 'react';
import { FileText, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';

export interface UploadedDoc {
  file: File;
  sessionId: string;
  messages: Message[];
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: string[];
}

const Index = () => {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [combinedSummary, setCombinedSummary] = useState<string>('');
  const [loadingCombinedSummary, setLoadingCombinedSummary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [spinnerMessage, setSpinnerMessage] = useState('');

  // Upload and register each file with backend
  const handleFilesUpload = async (files: File[]) => {
    setUploading(true);
    setSpinnerMessage('Uploading...');
    setIsProcessing(true);
    let newDocs: UploadedDoc[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        newDocs.push({ file, sessionId: data.session_id, messages: [] });
      } catch (e) {
        // Optionally show toast here
      }
    }
    setUploadedDocs(prev => {
      const updated = [...prev, ...newDocs];
      setActiveDocIndex(updated.length - 1);
      return updated;
    });
    setUploading(false);
    setLoadingCombinedSummary(true);
    setSpinnerMessage('Generating summary...');
    // After all uploads, fetch combined summary
    setTimeout(async () => {
      const session_ids = [...uploadedDocs, ...newDocs].map(doc => doc.sessionId).filter(Boolean);
      if (session_ids.length > 0) {
        try {
          const res = await fetch('http://localhost:8000/summary-multi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_ids })
          });
          if (!res.ok) throw new Error('Failed to get summary');
          const data = await res.json();
          setCombinedSummary(data.summary || '');
        } catch (e) {
          setCombinedSummary('Summary not available.');
        }
      }
      setLoadingCombinedSummary(false);
      setSpinnerMessage('');
    }, 100);
    setIsProcessing(false);
  };

  const handleFileRemove = (index: number) => {
    setUploadedDocs(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (activeDocIndex === index) {
        setActiveDocIndex(updated.length > 0 ? Math.max(0, index - 1) : null);
      } else if (activeDocIndex !== null && index < activeDocIndex) {
        setActiveDocIndex(activeDocIndex - 1);
      }
      // After removal, update combined summary
      const session_ids = updated.map(doc => doc.sessionId).filter(Boolean);
      if (session_ids.length > 0) {
        setLoadingCombinedSummary(true);
        fetch('http://localhost:8000/summary-multi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_ids })
        })
          .then(res => res.json())
          .then(data => setCombinedSummary(data.summary || ''))
          .catch(() => setCombinedSummary('Summary not available.'))
          .finally(() => setLoadingCombinedSummary(false));
      } else {
        setCombinedSummary('');
      }
      return updated;
    });
  };

  const handleStartChat = (docIndex: number) => {
    setActiveDocIndex(docIndex);
    setSidebarOpen(false);
  };

  const handleBackToLanding = () => {};

  const handleBackToHome = () => {
    setActiveDocIndex(null);
  };

  const handleAddMessage = (docIndex: number, message: Message) => {
    setUploadedDocs(prev => prev.map((doc, i) =>
      i === docIndex ? { ...doc, messages: [...doc.messages, message] } : doc
    ));
  };

  return (
    <div className="min-h-screen h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-background flex-shrink-0 w-full">
        <div className="px-4 sm:px-6 py-2 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary p-1 rounded-lg">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">Cenizas Docs Chat</h1>
                <p className="text-xs text-muted-foreground leading-tight">Chat with your PDF documents using AI</p>
              </div>
            </div>
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>
      {/* Main Layout */}
      <div className="flex-1 flex flex-row items-stretch overflow-hidden w-full h-full">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-4/5 max-w-xs sm:w-72 lg:w-80 bg-background
          transform transition-transform duration-300 ease-in-out
          lg:transform-none lg:transition-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex-shrink-0
          h-full
          flex flex-col
          items-stretch
          overflow-y-hidden
        `}>
          <Sidebar
            uploadedDocs={uploadedDocs}
            onFilesUpload={handleFilesUpload}
            onFileRemove={handleFileRemove}
            isProcessing={isProcessing}
            activeDocIndex={activeDocIndex}
            onStartChat={handleStartChat}
          />
        </aside>
        {/* Main Content */}
        <main className="flex-1 h-full flex flex-col overflow-hidden">
          <MainContent
            uploadedDocs={uploadedDocs}
            activeDocIndex={activeDocIndex}
            showChat={true}
            onStartChat={handleStartChat}
            onBackToHome={handleBackToHome}
            onAddMessage={handleAddMessage}
            combinedSummary={combinedSummary}
            loadingCombinedSummary={loadingCombinedSummary}
            uploading={uploading}
            spinnerMessage={spinnerMessage}
            isHome={activeDocIndex === null}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;