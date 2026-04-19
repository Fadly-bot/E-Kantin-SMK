import React, { ChangeEvent, useState } from 'react';

// 1. Tambahkan Interface agar bisa kirim data ke parent (TeacherDashboard)
interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
      ];

      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        onFileSelect(selectedFile); // 2. Kirim file ke TeacherDashboard
      } else {
        alert("Hanya boleh upload PDF, DOCX, atau PPTX!");
        e.target.value = "";
        setFile(null);
        onFileSelect(null);
      }
    }
  };

  return (
    <div className="p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">
        Lampiran Tugas (PDF/DOCX/PPTX)
      </label>
      <input 
        type="file" 
        accept=".pdf,.docx,.pptx"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-xl file:border-0
          file:text-sm file:font-bold
          file:bg-deep-blue file:text-white
          hover:file:bg-slate-800 transition-all"
      />
      {file && (
        <div className="mt-3 flex items-center gap-2 text-fresh-green">
          <div className="w-2 h-2 bg-fresh-green rounded-full animate-pulse"></div>
          <p className="text-xs font-bold">File siap: {file.name}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;