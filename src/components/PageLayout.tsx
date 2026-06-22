import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const PageLayout = ({ title, description, actions, children }: PageLayoutProps) => {
  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-6 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
      </div>
      <div className="flex-1 px-6 lg:px-8 py-6">{children}</div>
    </div>
  );
};

export default PageLayout;
