import React, { useCallback, useEffect } from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, children, size = 'medium' }) => {
  const handleOverlayClick = useCallback((e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleOverlayClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOverlayClick);
    };
  }, [isOpen, handleOverlayClick]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-content modal-${size}`}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;