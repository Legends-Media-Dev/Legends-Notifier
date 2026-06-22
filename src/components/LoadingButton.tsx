import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type LoadingButtonVariant = 'primary' | 'secondary' | 'danger' | 'accent-sm' | 'outline-sm' | 'danger-sm';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: LoadingButtonVariant;
  icon?: ReactNode;
}

const variantClasses: Record<LoadingButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium',
  'danger-sm': 'px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium',
  'accent-sm': 'px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors text-xs font-medium',
  'outline-sm':
    'px-2.5 py-1.5 text-gray-600 hover:text-accent hover:bg-accent-light rounded-lg transition-colors text-xs font-medium border border-gray-200',
};

const LoadingButton = ({
  loading = false,
  loadingText,
  variant = 'primary',
  icon,
  children,
  disabled,
  className = '',
  type = 'button',
  ...props
}: LoadingButtonProps) => {
  return (
    <button
      type={type}
      {...props}
      disabled={disabled || loading}
      className={`${variantClasses[variant]} flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

export default LoadingButton;
