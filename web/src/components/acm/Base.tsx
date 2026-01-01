export function Base({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="cursor-pointer">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
