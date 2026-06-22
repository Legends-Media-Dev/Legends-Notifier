import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Pencil, FileEdit } from 'lucide-react';
import { Notification } from '../lib/api';
import { truncateText } from '../lib/utils';

interface DuplicateSuccessModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (notification: Notification) => void;
}

const DuplicateSuccessModal = ({
  notification,
  isOpen,
  onClose,
  onEdit,
}: DuplicateSuccessModalProps) => {
  if (!notification) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="px-6 pt-8 pb-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-5">
                  <Copy className="w-7 h-7 text-accent" />
                </div>

                <h2 className="text-xl font-bold text-ink mb-2">
                  Campaign duplicated
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  A new draft was created. Would you like to edit it before sending or scheduling?
                </p>

                <div className="bg-surface-muted border border-gray-200 rounded-xl px-4 py-3 text-left mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Your draft
                  </p>
                  <p className="text-sm font-semibold text-ink line-clamp-1">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {truncateText(notification.body, 90)}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => onEdit(notification)}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    <Pencil className="w-4 h-4" />
                    Yes, edit it
                  </button>
                  <button
                    onClick={onClose}
                    className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
                  >
                    <FileEdit className="w-4 h-4" />
                    Not now — keep as draft
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  You can always find this draft under the Drafts tab.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DuplicateSuccessModal;
