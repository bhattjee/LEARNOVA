import { useState } from "react";
import { uploadFile } from "@/services/uploadService";
import { toast } from "sonner";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const upload = async (file: File, fileType: 'image' | 'document' | 'any') => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const res = await uploadFile(file, fileType, (p) => setProgress(p));
      setUploadedUrl(res.url);
      return res.url;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Upload failed";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedUrl(null);
  };

  return {
    uploading,
    progress,
    error,
    uploadedUrl,
    upload,
    reset,
  };
}
