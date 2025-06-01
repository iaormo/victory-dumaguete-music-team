
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { UserRole } from '../types';

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number; // 0-indexed
  filterRole: UserRole | null;
}

const CodeBracketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-6 h-6 ${props.className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a8.966 8.966 0 01-7.884 0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


const EmbedCodeModal: React.FC<EmbedCodeModalProps> = ({ isOpen, onClose, year, month, filterRole }) => {
  const [iframeCode, setIframeCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const baseUrl = window.location.origin + window.location.pathname;
      let embedPath = `#/embed/calendar/${year}/${month}`;
      if (filterRole) {
        embedPath += `?filterRole=${encodeURIComponent(filterRole)}`;
      }
      const fullEmbedUrl = `${baseUrl}${embedPath}`;
      
      setIframeCode(
        `<iframe src="${fullEmbedUrl}"\n` +
        `  width="100%"\n` +
        `  height="600px"\n` + // Default height, user can change
        `  style="border:1px solid #ccc; border-radius: 8px;"\n` +
        `  title="Music Team Schedule Calendar"\n` +
        `  loading="lazy">\n` +
        `</iframe>`
      );
      setCopied(false); // Reset copied status when modal opens or props change
    }
  }, [isOpen, year, month, filterRole]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy code. Please try manually selecting and copying.');
    });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Embed Calendar Code"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-center text-sm text-gray-700">
          <CodeBracketIcon className="w-6 h-6 mr-2 text-indigo-600" />
          <p>Copy the HTML code below and paste it into your website where you want the calendar to appear.</p>
        </div>
        
        <div>
          <label htmlFor="iframeCodeTextarea" className="block text-sm font-medium text-gray-700 mb-1">
            Iframe Code:
          </label>
          <textarea
            id="iframeCodeTextarea"
            readOnly
            value={iframeCode}
            rows={8}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 custom-scrollbar"
            aria-label="Iframe embed code"
          />
        </div>

        <Button 
          onClick={handleCopyToClipboard} 
          variant="primary" 
          className="w-full"
          leftIcon={copied ? <CheckCircleIcon className="text-green-300"/> : <ClipboardIcon />}
          disabled={copied}
        >
          {copied ? 'Copied to Clipboard!' : 'Copy Code'}
        </Button>

        <div className="text-xs text-gray-500 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="font-semibold mb-1">Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>You can adjust the `width` and `height` attributes in the code to fit your layout.</li>
            <li>The calendar is read-only and will reflect live updates as they happen in the main application.</li>
            <li>Ensure the website embedding this iframe can access this application's URL.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default EmbedCodeModal;
