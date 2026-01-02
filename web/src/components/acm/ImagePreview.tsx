import { useEffect } from "react";

type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
};

export const ImagePreview = ({ src, alt, onClose }: Props) => {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-3xl cursor-pointer"
        >
          ✕
        </button>

        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};
