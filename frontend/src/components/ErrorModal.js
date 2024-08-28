import React from 'react';
import '../styles/ErrorModal.css';

const ErrorModal = ({ message, onClose }) => {
  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div className="error-modal-content" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <button onClick={onClose}>확인</button>
      </div>
    </div>
  );
};

export default ErrorModal;