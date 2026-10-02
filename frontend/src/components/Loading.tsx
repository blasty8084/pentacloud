import { useEffect, useState } from 'react';
import { Loader2, Server } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ message, size = 'md' }: LoadingProps) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const sizes = {
    sm: { spinner: 'w-5 h-5', text: 'text-xs', server: 'w-4 h-4' },
    md: { spinner: 'w-8 h-8', text: 'text-sm', server: 'w-6 h-6' },
    lg: { spinner: 'w-12 h-12', text: 'text-base', server: 'w-8 h-8' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className={`${s.spinner} text-accent-primary animate-spin`} />
        <p className={`text-text-secondary ${s.text}`}>
          {isSlow
            ? 'Waking up the server, this can take up to a minute...'
            : message || 'Loading...'}
        </p>
        {isSlow && <Server className={`${s.server} text-accent-primary animate-pulse`} />}
      </div>
    </div>
  );
}