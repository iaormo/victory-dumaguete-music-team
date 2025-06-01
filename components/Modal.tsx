import React, { ReactNode, useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Delay setting the "open" animation classes to allow initial styles to apply
      const openTimer = setTimeout(() => {
        setAnimationClass('opacity-100 scale-100');
      }, 10); // Small delay for transition to trigger correctly
      return () => clearTimeout(openTimer);
    } else {
      // Start exit animation
      setAnimationClass('opacity-0 scale-95');
      const closeTimer = setTimeout(() => {
        setShouldRender(false); // Unmount after animation
      }, 300); // Duration should match transition duration
      return () => clearTimeout(closeTimer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ease-in-out backdrop-blur-sm
        ${isOpen && animationClass.includes('opacity-100') ? 'bg-opacity-60' : 'bg-opacity-0'}`}
        onClick={onClose} // Allow closing by clicking backdrop
        aria-modal="true"
        role="dialog"
    >
      <div 
        className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out m-4
        ${animationClass || 'opacity-0 scale-95'}`} // Initial state for enter, or target for exit
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-blue-700">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-gray-700 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {children}
        </div>
        {footer && <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;