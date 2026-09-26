import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { FileText, Folder, X } from 'lucide-react';

interface Item {
  id: string;
  name: string;
}

interface RenameModalProps {
  item: Item;
  type: 'file' | 'folder';
  onRename: (id: string, name: string, type: 'file' | 'folder') => Promise<void>;
  onClose: () => void;
}

export function RenameModal({ item, type, onRename, onClose }: RenameModalProps) {
  const [name, setName] = useState(item.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const input = document.querySelector('input[name="rename-input"]') as HTMLInputElement;
    input?.focus();
    input?.select();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === item.name) {
      onClose();
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onRename(item.id, name.trim(), type);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rename');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Rename {type}</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <Input
        name="rename-input"
        label={`${type === 'file' ? 'File' : 'Folder'} name`}
        value={name}
        onChange={e => setName(e.target.value)}
        error={error}
        autoFocus
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </Button>
        <Button type="submit" loading={loading}>
          <span>Rename</span>
        </Button>
      </div>
    </form>
  );
}