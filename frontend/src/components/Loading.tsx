import { useEffect, useState } from 'react';
import { Loader2, Server } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export default function Loading({ message }: LoadingProps) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-600">
          {isSlow
            ? 'Waking up the server, this can take up to a minute...'
            : message || 'Loading...'}
        </p>
        {isSlow && <Server className="w-6 h-6 text-blue-600 animate-pulse" />}
      </div>
    </div>
  );
}