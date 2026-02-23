interface ConfirmDialogProps {
  isOpen: boolean;
  choiceLabel: string;
  choiceImage?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  choiceLabel,
  choiceImage,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={!isSubmitting ? onCancel : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm glass rounded-2xl overflow-hidden animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold text-center">回答の確認</h3>
          <p className="text-muted text-sm text-center mt-1">
            以下の選択肢で回答しますか？
          </p>
        </div>

        {/* Choice preview — image and label are strictly stacked, never overlapping */}
        <div className="border-t border-b border-[var(--color-primary)]/30 mb-5">
          {choiceImage && (
            /* Wrapper maintains 4:3 aspect ratio; object-contain shows full image */
            <div className="w-full aspect-[4/3] bg-black/20 overflow-hidden">
              <img
                src={choiceImage}
                alt={choiceLabel}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="px-4 py-3 text-center font-bold text-[var(--color-primary-light)] bg-[var(--color-primary)]/5">
            {choiceLabel}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl border border-border text-muted hover:border-white/30 hover:text-white transition-colors disabled:opacity-50 font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl gradient-primary text-white font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "送信中..." : "送信する"}
          </button>
        </div>
      </div>
    </div>
  );
}
