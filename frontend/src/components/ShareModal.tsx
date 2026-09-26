import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Copy, Check, ExternalLink, Link2 } from 'lucide-react';

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
      <p className="text-sm text-text-secondary">
        Create a shareable download link for <strong className="text-text-primary">{file.name}</strong>
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
        <div className="space-y-2 p-4 card bg-surface-secondary/50">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Shareable Link</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="input flex-1 bg-surface-tertiary"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            >
              {copied ? <Check className="w-4 h-4 text-accent-success" /> : <Copy className="w-4 h-4" />}
            </Button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              aria-label="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          {expiresInHours && (
            <p className="text-xs text-text-tertiary flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-accent-warning/20 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-warning" />
              </span>
              Expires in {expiresInHours} hour{expiresInHours !== '1' ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}