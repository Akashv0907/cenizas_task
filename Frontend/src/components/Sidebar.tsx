import React from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { UploadedDoc } from '@/pages/Index';

interface SidebarProps {
  uploadedDocs: UploadedDoc[];
  onFilesUpload: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  isProcessing: boolean;
  activeDocIndex: number | null;
  onStartChat: (docIndex: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  uploadedDocs,
  onFilesUpload,
  onFileRemove,
  isProcessing,
  activeDocIndex,
  onStartChat
}) => {
  return (
    <aside className="bg-background border-r border-border h-full flex flex-col items-stretch">
      <div className="p-4 space-y-5 flex-1 flex flex-col">
        {/* Upload Section */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Upload PDF(s)</h2>
          <div className="bg-upload-background border border-upload-border rounded-lg p-4 sm:p-3 flex flex-col items-center justify-center">
            <FileUpload
              onFilesUpload={onFilesUpload}
              isProcessing={isProcessing}
            />
          </div>
        </div>
        {/* Uploaded Documents List */}
        {uploadedDocs.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-1">Uploaded Documents</h3>
            <ul className="space-y-1">
              {uploadedDocs.map((doc, idx) => (
                <li key={doc.sessionId} className={`flex items-center justify-between p-1 rounded border ${activeDocIndex === idx ? 'border-accent bg-accent/10' : 'border-border'}`}>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <span className="truncate max-w-[100px] text-xs">{doc.file.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="outline" onClick={() => onStartChat(idx)} disabled={isProcessing} className="text-xs px-2 py-1">
                      Chat
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onFileRemove(idx)} disabled={isProcessing} className="text-xs">
                      ×
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* How it works section (unchanged) */}
        <div className="pt-4 border-t border-border mt-auto">
          <h3 className="text-sm font-semibold text-foreground mb-2">How it works</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-medium text-xs mb-0.5">Upload your PDF document</h4>
                <p className="text-xs text-muted-foreground">Select and upload the PDF file you want to analyze</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-medium text-xs mb-0.5">Wait for the AI to process your document</h4>
                <p className="text-xs text-muted-foreground">Our AI analyzes the content and structure</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-medium text-xs mb-0.5">Ask questions about the document content</h4>
                <p className="text-xs text-muted-foreground">Type your questions in natural language</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <h4 className="font-medium text-xs mb-0.5">Get accurate answers with source references</h4>
                <p className="text-xs text-muted-foreground">Receive detailed responses with page references</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};