import React, { createContext, useContext, useState, useCallback } from 'react';
import './ConfirmModal.css';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setModal({ message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    modal?.resolve(true);
    setModal(null);
  };

  const handleCancel = () => {
    modal?.resolve(false);
    setModal(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal && (
        <div
          className="confirm-overlay"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-message"
        >
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <p className="confirm-message" id="confirm-message">{modal.message}</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button className="confirm-ok" onClick={handleConfirm} autoFocus>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context.confirm;
};
