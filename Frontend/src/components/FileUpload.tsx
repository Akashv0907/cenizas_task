import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFilesUpload: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUpload,
  isProcessing
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported',
      });
      return false;
    }
    if (file.size > 50 * 1024 * 1024) { // 50MB
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'File size must be less than 50MB',
      });
      return false;
    }
    return true;
  };

  const handleFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(validateFile);
    if (validFiles.length > 0) {
      onFilesUpload(validFiles);
    }
  }, [onFilesUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-2 w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-4 sm:p-3 text-center transition-colors cursor-pointer w-full
          ${isDragOver 
            ? 'border-accent bg-upload-background' 
            : 'border-border hover:border-accent hover:bg-upload-background'
          }`}
        style={{ minHeight: '160px', maxWidth: '100%' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          multiple
          max={52428800}
          onChange={handleInputChange}
          className="hidden"
        />
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          Drag & drop your PDF(s) here or
        </p>
        <Button 
          type="button" 
          variant="default"
          className="mb-2 text-xs px-3 py-1"
          disabled={isProcessing}
        >
          Browse Files
        </Button>
        <p className="text-xs text-muted-foreground">
          Max size: 50MB each
        </p>
      </div>
    </div>
  );
};