import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ show, onClose, title, message, buttonText, onButtonClick }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="modal-overlay-success">
            <div className="modal-content-success">
                <div className="success-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2>{title}</h2>
                <p>{message}</p>
                <button onClick={onButtonClick} className="success-modal-btn">
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
