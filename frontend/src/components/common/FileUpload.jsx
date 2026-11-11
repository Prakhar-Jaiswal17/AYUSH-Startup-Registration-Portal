import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { DOCUMENT_ACCEPT, DOCUMENT_MAX_SIZE_BYTES } from '../../utils/documentUpload';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const itemVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: 'auto', marginTop: 8 },
  exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } },
};

export default function FileUpload({
  onFileSelect,
  accept = DOCUMENT_ACCEPT,
  maxSize = DOCUMENT_MAX_SIZE_BYTES,
  multiple = false,
  existingFiles = [],
  onRemove,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);

  const validateAndAddFiles = useCallback(
    (newFiles) => {
      const validFiles = [];
      const fileErrors = [];
      Array.from(newFiles).forEach((file) => {
        if (file.size > maxSize) {
          fileErrors.push(`${file.name} exceeds the ${formatFileSize(maxSize)} size limit.`);
          return;
        }
        if (accept) {
          const acceptedTypes = accept.split(',').map((t) => t.trim());
          const fileExt = '.' + file.name.split('.').pop().toLowerCase();
          const matches = acceptedTypes.some(
            (type) =>
              type === file.type ||
              type === fileExt ||
              (type.endsWith('/*') && file.type.startsWith(type.replace('/*', '/'))),
          );
          if (!matches) {
            fileErrors.push(`${file.name} is not an accepted file type.`);
            return;
          }
        }
        validFiles.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          progress: 0,
          status: 'uploading',
        });
      });
      setErrors(fileErrors);
      if (validFiles.length) {
        const updated = multiple ? [...files, ...validFiles] : validFiles.slice(0, 1);
        setFiles(updated);
        onFileSelect && onFileSelect(updated.map((f) => f.file));

        validFiles.forEach((vf) => {
          simulateUpload(vf.id);
        });
      }
    },
    [accept, maxSize, multiple, files, onFileSelect],
  );

  const simulateUpload = (fileId) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: 100, status: 'done' } : f,
          ),
        );
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: Math.min(progress, 99) } : f,
          ),
        );
      }
    }, 300);
  };

  const handleRemoveNew = (fileId) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      onFileSelect && onFileSelect(updated.map((f) => f.file));
      return updated;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };
  const handleInputChange = (e) => {
    if (e.target.files.length) {
      validateAndAddFiles(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-[#145A43] bg-[#145A43]/5'
            : 'border-[#E5E7EB] hover:border-[#145A43]/40 bg-[#F7F9F6]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
        <UploadCloud
          className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-[#145A43]' : 'text-[#6B756F]/50'}`}
        />
        <p className="text-sm font-medium text-[#202A25]">
          Drag & drop files here, or{' '}
          <span className="text-[#145A43] underline">browse</span>
        </p>
        <p className="text-xs text-[#6B756F] mt-1">
          {accept ? `Accepted: ${accept}` : 'All file types accepted'} · Max{' '}
          {formatFileSize(maxSize)}
        </p>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {existingFiles.map((file, idx) => (
          <motion.div
            key={`existing-${idx}`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-white"
          >
            <File className="w-5 h-5 text-[#145A43] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#202A25] truncate">
                {file.name || file}
              </p>
              {file.size && (
                <p className="text-xs text-[#6B756F]">{formatFileSize(file.size)}</p>
              )}
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {onRemove && (
              <button
                onClick={() => onRemove(idx)}
                className="p-1 rounded hover:bg-red-50 text-[#6B756F] hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}

        {files.map((fileItem) => (
          <motion.div
            key={fileItem.id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-white"
          >
            <File className="w-5 h-5 text-[#145A43] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#202A25] truncate">
                {fileItem.file.name}
              </p>
              <p className="text-xs text-[#6B756F]">
                {formatFileSize(fileItem.file.size)}
              </p>
              {fileItem.status === 'uploading' && (
                <div className="mt-1.5 w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#145A43] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${fileItem.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
            {fileItem.status === 'done' && (
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}
            <button
              onClick={() => handleRemoveNew(fileItem.id)}
              className="p-1 rounded hover:bg-red-50 text-[#6B756F] hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
