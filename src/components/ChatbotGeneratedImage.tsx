import { forwardRef, type ImgHTMLAttributes } from "react";
import { Download, Expand } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const downloadImage = (src: string, alt?: string) => {
  const link = document.createElement("a");
  const fileName = (alt || "car-image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  link.href = src;
  link.download = `${fileName || "car-image"}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const ChatbotGeneratedImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(
  ({ alt, className, src, ...props }, ref) => {
    const imageAlt = alt || "AI generated car image";

    if (!src) {
      return null;
    }

    return (
      <figure className="not-prose my-3 overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <div className="group relative">
          <img
            ref={ref}
            src={src}
            alt={imageAlt}
            className={cn("max-h-[280px] w-full object-cover", className)}
            {...props}
          />

          <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="border border-border/70 bg-background/85 text-foreground backdrop-blur-sm"
                  aria-label="Preview image full screen"
                >
                  <Expand className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl border-border/70 bg-background/95 p-3 sm:p-4">
                <DialogTitle className="sr-only">{imageAlt}</DialogTitle>
                <img
                  src={src}
                  alt={imageAlt}
                  className="max-h-[80vh] w-full rounded-lg object-contain"
                />
              </DialogContent>
            </Dialog>

            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="border border-border/70 bg-background/85 text-foreground backdrop-blur-sm"
              aria-label="Download image"
              onClick={() => downloadImage(src, imageAlt)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <figcaption className="border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
          {imageAlt}
        </figcaption>
      </figure>
    );
  },
);

ChatbotGeneratedImage.displayName = "ChatbotGeneratedImage";

export default ChatbotGeneratedImage;