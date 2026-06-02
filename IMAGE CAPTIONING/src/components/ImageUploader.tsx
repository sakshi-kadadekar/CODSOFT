import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadedImage {
  file: File;
  url: string;
  width: number;
  height: number;
}

interface Props {
  image: UploadedImage | null;
  onChange: (img: UploadedImage | null) => void;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

export function ImageUploader({ image, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        onChange({ file, url, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
    },
    [onChange],
  );

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "relative cursor-pointer rounded-lg border border-dashed border-border bg-card/40 transition-colors",
              "hover:border-primary/60 hover:bg-card/60",
              "flex flex-col items-center justify-center gap-3 py-16 px-6 text-center",
              dragging && "border-primary bg-primary/5",
            )}
          >
            <div className="rounded-full border border-border bg-background/60 p-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Drop an image here</p>
              <p className="font-mono text-xs text-muted-foreground">
                JPG · PNG · WEBP — or click to browse
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <div className="relative">
              <img src={image.url} alt="upload preview" className="block w-full" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={() => onChange(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-background/40 px-4 py-2.5 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" />
                {image.file.name}
              </span>
              <span>{(image.file.size / 1024).toFixed(1)} KB</span>
              <span>
                {image.width} × {image.height}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
