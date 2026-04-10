import { useState, type FormEvent } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  isSubmitting: boolean;
  onCreatePost: (imageUrl: string, caption: string) => Promise<boolean>;
}

export function CreatePostModal({
  open,
  onOpenChange,
  disabled,
  isSubmitting,
  onCreatePost,
}: CreatePostModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedImage = imageUrl.trim();
    const trimmedCaption = caption.trim();

    if (!trimmedImage || !trimmedCaption || disabled) {
      return;
    }

    const isSuccess = await onCreatePost(trimmedImage, trimmedCaption);
    if (isSuccess) {
      setImageUrl("");
      setCaption("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bottom-0 left-0 top-auto z-50 w-full max-h-[90dvh] translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl rounded-b-none border border-white/10 bg-black/70 p-5 shadow-2xl backdrop-blur-xl sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,440px)] sm:max-h-none sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">New Post</DialogTitle>
          <DialogDescription className="text-white/60">
            Share an image or video to the Sepolia feed.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <label className="text-sm font-medium" htmlFor="create-image-url">
            Image / Video URL
          </label>
          <input
            id="create-image-url"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Image URL (https://...)"
            required
            disabled={disabled || isSubmitting}
            className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/40 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
          />

          <label className="text-sm font-medium" htmlFor="create-caption">
            Caption
          </label>
          <textarea
            id="create-caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Write a caption..."
            required
            rows={3}
            disabled={disabled || isSubmitting}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/40 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
          />

          <Button type="submit" disabled={disabled || isSubmitting} className="mt-2 h-12 rounded-xl text-base">
            {isSubmitting ? "Posting..." : "Publish"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
