import React from 'react';

interface ErrorMessageProps {
    message: string;
    onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
    return (
        <div className="alert alert-danger alert-dismissible fade show mt-4" role="alert">
            <h4 className="alert-heading h6">An Error Occurred</h4>
            <p>{message}</p>
            <button type="button" className="btn-close" onClick={onDismiss} aria-label="Close"></button>
        </div>
    );
};

export default ErrorMessage;