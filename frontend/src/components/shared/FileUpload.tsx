import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import * as React from "react";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  label?: string;
}

export function FileUpload({ onUpload, label = "Anexar arquivo" }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload(file);
      showToast({ title: "Anexo enviado", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao enviar anexo", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
      <Button type="button" variant="outline" size="sm" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
        {!isUploading && <Paperclip className="h-4 w-4" />}
        {label}
      </Button>
    </div>
  );
}
