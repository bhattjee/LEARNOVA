import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, File as FileIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { resolvePublicFileUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Progress } from "@/components/ui/progress";

interface FileUploadZoneProps {
  onUpload: (url: string) => void;
  allowedTypes: 'image' | 'document' | 'any';
  maxSizeMb?: number;
  label?: string;
  currentUrl?: string | null;
  className?: string;
  onRemove?: () => void;
  /** Tighter square-style zone for course cover in a sidebar layout. */
  compact?: boolean;
}

export function FileUploadZone({
  onUpload,
  allowedTypes,
  maxSizeMb = 50,
  label = "Upload File",
  currentUrl,
  className,
  onRemove,
  compact = false,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress, error, reset } = useFileUpload();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndUpload = async (file: File) => {
    // Basic validation
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`File is too large. Max size is ${maxSizeMb}MB.`);
      return;
    }
    
    try {
      const url = await upload(file, allowedTypes);
      onUpload(url);
    } catch (err) {
      // toast is handled in useFileUpload
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    reset();
    if (onRemove) onRemove();
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all",
          compact
            ? "aspect-square min-h-[200px] max-h-[280px] w-full max-w-[280px] p-4"
            : "min-h-[160px] p-6",
          dragActive ? "border-[#1D4ED8] bg-[#EFF6FF]" : "border-[#C5CAD3] bg-white",
          uploading && "pointer-events-none opacity-80",
          !currentUrl && "hover:border-[#1D4ED8] hover:bg-[#F8FAFC] cursor-pointer"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !currentUrl && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={
            allowedTypes === 'image' 
              ? "image/*" 
              : allowedTypes === 'document' 
                ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" 
                : "*"
          }
        />

        {uploading ? (
          <div className="w-full max-w-[240px] text-center">
            <p className="text-[14px] font-bold text-[#0F172A] mb-3">Uploading...</p>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-[12px] text-[#464749]">{progress}% completed</p>
          </div>
        ) : currentUrl ? (
          <div className={cn("flex w-full items-center gap-3", compact && "flex-col justify-center gap-2")}>
            <div
              className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#EFF6FF]",
                compact ? "h-32 w-32" : "h-12 w-12",
              )}
            >
              {allowedTypes === 'image' ? (
                <img
                  src={resolvePublicFileUrl(currentUrl) ?? currentUrl}
                  className="h-full w-full object-cover"
                  alt="Preview"
                />
              ) : (
                <FileIcon className="w-6 h-6 text-[#1D4ED8]" />
              )}
            </div>
            <div className={cn("min-w-0 flex-1", compact && "w-full text-center")}>
              <p className="truncate text-[14px] font-bold text-[#0F172A]">
                {currentUrl.split('/').pop()}
              </p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[12px] font-medium text-green-600">Uploaded</span>
              </div>
            </div>
            <div className={cn("flex items-center gap-2", compact && "justify-center")}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="text-[13px] font-bold text-[#1D4ED8] hover:underline"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-[#464749]" />
            </div>
            <p className="text-[15px] font-bold text-[#0F172A] mb-1">{label}</p>
            <p className="text-[13px] text-[#464749]">or drag and drop here</p>
            <p className="text-[11px] text-[#464749]/60 mt-4 uppercase tracking-wider font-semibold">
              Max size: {maxSizeMb}MB • PDF, DOCX, JPG, PNG
            </p>
          </div>
        )}

        {error && !uploading && !currentUrl && (
          <div className="absolute bottom-4 flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
