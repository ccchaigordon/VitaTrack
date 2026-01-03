type ConfirmDeleteProps = {
  title?: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
};

export function ConfirmDelete({
  title = "Confirm",
  message,
  isOpen,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmDeleteProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-80 sm:max-w-sm max-w-[80vw] text-center">
        {title && <h3 className="sm:text-lg text-sm font-semibold mb-4 text-gray-900">{title}</h3>}
        <p className="sm:text-sm text-xs text-gray-600 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            className="sm:text-sm text-xs px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 cursor-pointer"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="sm:text-sm text-xs px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white cursor-pointer"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}