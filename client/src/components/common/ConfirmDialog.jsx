import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Löschen
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{message}</p>
    </Modal>
  );
}
