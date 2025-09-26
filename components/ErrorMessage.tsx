import React from 'react';

interface ErrorMessageProps {
    message: string;
    onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
    return (
        <div className="p-4 mt-8 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md max-w-4xl mx-auto flex justify-between items-center animate-fade-in" role="alert">
            <div>
                <p className="font-bold">An Error Occurred</p>
                <p className="text-sm">{message}</p>
            </div>
            <button
                onClick={onDismiss}
                className="p-1.5 rounded-full hover:bg-red-200 transition-colors"
                aria-label="Dismiss error message"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default ErrorMessage;
