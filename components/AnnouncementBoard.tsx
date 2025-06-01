
import React from 'react';
import { Announcement } from '../types';

interface AnnouncementBoardProps {
  announcements: Announcement[];
}

const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({ announcements }) => {
  const sortedAnnouncements = [...announcements].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sortedAnnouncements.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-lg">No announcements yet.</p>
        <p className="text-sm">Check back later for updates!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[30rem] overflow-y-auto custom-scrollbar p-1 pr-2">
      {sortedAnnouncements.map(announcement => (
        <div key={announcement.id} className="bg-blue-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-150 border border-blue-200">
          <p className="text-gray-800 whitespace-pre-wrap break-words">{announcement.content}</p>
          <p className="text-xs text-blue-700 mt-2 font-medium">
            Posted by {announcement.authorName} on {formatTimestamp(announcement.timestamp)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBoard;