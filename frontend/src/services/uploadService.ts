import { apiClient } from "./apiClient";

export interface UploadResponse {
  url: string;
  filename: string;
  size_bytes: number;
  content_type: string;
}

export async function uploadFile(
  file: File, 
  fileType: 'image' | 'document' | 'any',
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("file_type", fileType);

  const res = await apiClient.post<UploadResponse>("/api/v1/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return res.data;
}
