import { useState, type FormEvent } from "react";

interface CreatePostFormProps {
  disabled: boolean;
  isSubmitting: boolean;
  onCreatePost: (imageUrl: string, caption: string) => Promise<boolean>;
}

export function CreatePostForm({ disabled, isSubmitting, onCreatePost }: CreatePostFormProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedImage = imageUrl.trim();
    const trimmedCaption = caption.trim();

    if (!trimmedImage || !trimmedCaption) {
      return;
    }

    const isSuccess = await onCreatePost(trimmedImage, trimmedCaption);
    if (isSuccess) {
      setImageUrl("");
      setCaption("");
    }
  };

  return (
    <section className="panel">
      <h2>Create Post</h2>
      <form className="stack" onSubmit={handleSubmit}>
        <label htmlFor="image-url">Image URL</label>
        <input
          id="image-url"
          type="url"
          placeholder="https://picsum.photos/600/400"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          disabled={disabled || isSubmitting}
          required
        />

        <label htmlFor="caption">Caption</label>
        <textarea
          id="caption"
          placeholder="Write a short caption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          disabled={disabled || isSubmitting}
          rows={3}
          required
        />

        <button type="submit" disabled={disabled || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Create Post"}
        </button>
      </form>
    </section>
  );
}
