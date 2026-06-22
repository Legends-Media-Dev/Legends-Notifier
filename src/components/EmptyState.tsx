import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="page-card p-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-4 text-accent">
        {icon}
      </div>
      <p className="text-ink font-semibold text-lg">{title}</p>
      {description && <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6 flex items-center justify-center gap-3">{action}</div>}
    </div>
  );
};

export default EmptyState;
