import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';

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
      <Input
        name="rename-input"
        label={`${type === 'file' ? 'File' : 'Folder'} name`}
        value={name}
        onChange={e => setName(e.target.value)}
        error={error}
        autoFocus
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Rename
        </Button>
      </div>
    </form>
  );
}