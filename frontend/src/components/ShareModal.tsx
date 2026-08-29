import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface File {
  id: string;
  name: string;
}

interface ShareModalProps {
  file: File;
  onCreate: (fileId: string, expiresInHours?: number) => Promise<{ token: string; shareUrl: string; expiresAt: number | null } | null>;
  onClose: () => void;
}

export function ShareModal({ file, onCreate, onClose }: ShareModalProps) {
  const [expiresInHours, setExpiresInHours] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const hours = expiresInHours ? parseInt(expiresInHours, 10) : undefined;
      const result = await onCreate(file.id, hours);
      if (result) {
        setShareUrl(result.shareUrl);
        setCopied(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Create a shareable download link for <strong>{file.name}</strong>
      </p>

      <div className="space-y-3">
        <Input
          label="Expires in (hours, optional)"
          type="number"
          value={expiresInHours}
          onChange={e => setExpiresInHours(e.target.value)}
          placeholder="Leave empty for no expiry"
          min={1}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCreate} loading={loading} className="flex-1">
          Create Link
        </Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>

      {shareUrl && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
          <p className="text-xs font-medium text-gray-500">Shareable Link</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          {expiresInHours && (
            <p className="text-xs text-gray-500">
              Expires in {expiresInHours} hour{expiresInHours !== '1' ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}