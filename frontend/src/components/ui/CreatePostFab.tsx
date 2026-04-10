import { Plus } from "lucide-react";
import { Button } from "./button";

interface CreatePostFabProps {
  onClick: () => void;
}

export function CreatePostFab({ onClick }: CreatePostFabProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center">
      <Button
        type="button"
        size="icon"
        className="pointer-events-auto h-14 w-14 rounded-full border border-border shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
        onClick={onClick}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Create post</span>
      </Button>
    </div>
  );
}
