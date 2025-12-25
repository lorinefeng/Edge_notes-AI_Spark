import { useState } from "react";

interface UploadResult {
  id: number;
  url: string;
  alt: string;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const data: UploadResult = await res.json();
      
      // Return markdown format
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        return `![${data.alt}](${data.url})`;
      } else {
        return `[${data.alt}](${data.url})`;
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message);
      return ""; // Return empty string on failure
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
}
