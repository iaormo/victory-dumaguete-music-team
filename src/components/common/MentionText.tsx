import React from 'react';

interface MentionTextProps {
  text: string;
  className?: string;
}

const MentionText: React.FC<MentionTextProps> = ({ text, className = '' }) => {
  const parts = text.split(/(@\w+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="text-primary-600 font-semibold bg-primary-50 px-0.5 rounded">
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
};

export default MentionText;
