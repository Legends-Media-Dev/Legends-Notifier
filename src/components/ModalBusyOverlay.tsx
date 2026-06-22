import { Loader2 } from 'lucide-react';

interface ModalBusyOverlayProps {
  show: boolean;
  label?: string;
}

const ModalBusyOverlay = ({ show, label = 'Working...' }: ModalBusyOverlayProps) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-3 rounded-2xl">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
};

export default ModalBusyOverlay;
