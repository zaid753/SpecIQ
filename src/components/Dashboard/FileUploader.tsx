import React, { useState, useRef } from "react";
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { ref as dbRef, push, set } from "firebase/database";
import { db } from "../../lib/firebase";

interface FileUploaderProps {
  projectId: string;
}

export default function FileUploader({ projectId }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    const newUploads = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const,
      file
    }));

    setUploads(prev => [...prev, ...newUploads]);

    for (const upload of newUploads) {
      try {
        const formData = new FormData();
        formData.append("file", upload.file);
        formData.append("projectId", projectId);

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress } : u));
          }
        });

        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            
            // Save to RTDB
            const fileRecordRef = push(dbRef(db, `projects/${projectId}/files`));
            await set(fileRecordRef, {
              name: response.name,
              url: response.url,
              size: response.size,
              type: response.type,
              filename: response.filename,
              uploadedAt: Date.now(),
              processingStatus: 'pending'
            });

            setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'success', progress: 100 } : u));
            
            setTimeout(() => {
              setUploads(prev => prev.filter(u => u.id !== upload.id));
            }, 3000);
          } else {
            throw new Error(xhr.responseText || "Upload failed");
          }
        });

        xhr.addEventListener("error", () => {
          throw new Error("Network error");
        });

        xhr.open("POST", "/api/upload");
        xhr.send(formData);

      } catch (error: any) {
        console.error("Upload failed:", error);
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error', error: error.message } : u));
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">
          Upload Files
        </h3>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-[2.5rem] border-2 border-dashed transition-all p-12 text-center ${
          isDragging 
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10" 
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          multiple
        />
        
        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
          <Upload className={`w-8 h-8 ${isDragging ? "text-indigo-600" : "text-slate-400"}`} />
        </div>
        
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {isDragging ? "Drop files here" : "Drag & drop files here"}
        </h4>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm">
          Support for PDF, DOCX, TXT, CSV, JSON, and ZIP files. Max 50MB per file.
        </p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div 
              key={upload.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{upload.name}</p>
                  <span className="text-xs font-medium text-slate-500">
                    {upload.status === 'uploading' ? `${Math.round(upload.progress)}%` : upload.status}
                  </span>
                </div>
                
                {upload.status === 'error' ? (
                  <p className="text-[10px] text-red-500 truncate">{upload.error}</p>
                ) : (
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 bg-indigo-600`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {upload.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {upload.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
