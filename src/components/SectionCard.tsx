import { ReactNode } from 'react';

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

const SectionCard = ({ icon, title, description, action, children, footer }: SectionCardProps) => {
  return (
    <div className="page-card">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="section-icon text-accent">{icon}</div>
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">{title}</h2>
            {description && <div className="text-sm text-gray-500 mt-0.5">{description}</div>}
          </div>
        </div>
        {action}
      </div>
      {children}
      {footer && <div className="px-6 py-4 bg-surface-muted border-t border-gray-100">{footer}</div>}
    </div>
  );
};

export default SectionCard;
