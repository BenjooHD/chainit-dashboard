'use client';

import { useState } from 'react';
import { useTask, Bucket } from '@/context/TaskContext';
import { BUCKET_COLORS } from '@/lib/bucketColors';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface KanbanBucketManagerProps {
  onClose: () => void;
  bucket?: Bucket;
}

export default function KanbanBucketManager({ onClose, bucket }: KanbanBucketManagerProps) {
  const { addBucket, updateBucket } = useTask();
  const isEditing = !!bucket;
  const [name, setName] = useState(bucket?.name || '');
  const [color, setColor] = useState(bucket?.color || 'bg-blue-100');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEditing && bucket) {
        await updateBucket(bucket.id, { name, color });
      } else {
        await addBucket({ name, color });
      }
      onClose();
    } catch (err) {
      console.error('Error saving bucket:', err);
      setError('Error saving bucket. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEditing ? 'Edit Bucket' : 'New Bucket'}
      onClose={onClose}
      footer={
        <>
          <span />
          <Button type="submit" form="bucket-form" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="bucket-form" onSubmit={handleSubmit} className="form-stack">
        {error && <div className="form-error">{error}</div>}
        <label>
          Bucket name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., UI Design, Backend"
            autoFocus
          />
        </label>
        <label>
          Color
          <div className="color-grid">
            {BUCKET_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                onClick={() => setColor(c.value)}
                className={`color-swatch ${color === c.value ? 'color-swatch-active' : ''}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </label>
      </form>
    </Modal>
  );
}
