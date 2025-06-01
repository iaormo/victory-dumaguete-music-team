
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface AddAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostAnnouncement: (content: string) => void;
}

const AddAnnouncementModal: React.FC<AddAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onPostAnnouncement,
}) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) {
      setError('Announcement content cannot be empty.');
      return;
    }
    setError('');
    onPostAnnouncement(content.trim());
    setContent(''); // Clear content after successful post
    // onClose(); // Modal will be closed by Dashboard component after onPostAnnouncement
  };

  const handleModalClose = () => {
    setContent('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Post New Announcement"
      footer={
        <>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Post Announcement
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="announcementContent" className="block text-sm font-medium text-gray-700 mb-1">
            Announcement Details:
          </label>
          <textarea
            id="announcementContent"
            rows={6}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(''); // Clear error as user types
            }}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
            placeholder="Type your announcement here..."
            aria-describedby="announcement-error"
            aria-invalid={!!error}
          />
          {error && (
            <p id="announcement-error" className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Your announcement will be visible to all team members on the dashboard.
        </p>
      </div>
    </Modal>
  );
};

export default AddAnnouncementModal;
