import { createPortal } from "react-dom";

export function ConfirmModal({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, isDestructive = false }) {
  if (!isOpen) return null;

  // Render into document.body via a portal so the overlay escapes any ancestor
  // stacking context (e.g. the fixed-position employer sidebar). Without this,
  // the modal's z-index is trapped inside the parent and page content such as
  // recharts SVGs can paint on top of the backdrop.
  return createPortal((
    <div
      className="fixed inset-0 flex items-center justify-center p-md bg-black/90 backdrop-blur-lg"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        // Prevent clicks on backdrop from reaching background elements
        e.stopPropagation();
      }}
    >
      <div
        className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg max-w-sm w-full shadow-lg"
        onClick={(e) => {
          // Prevent modal content clicks from closing the modal
          e.stopPropagation();
        }}
      >
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">{title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{message}</p>
        <div className="flex justify-end gap-sm">
          <button 
            onClick={onCancel}
            className="px-4 py-2 font-label-md text-on-surface hover:bg-surface-container rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 font-label-md rounded-lg transition-colors ${
              isDestructive 
                ? "bg-error text-on-error hover:bg-error/80" 
                : "bg-primary text-on-primary hover:bg-secondary"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
