import React, { useState, FormEvent, useEffect } from 'react';
import { CheckIcon } from './icons';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset form when the modal is closed from the parent, ensuring it's fresh on reopen
  useEffect(() => {
    if (!isOpen) {
      // Allow closing animation to finish before resetting state
      setTimeout(() => {
        setIsSubmitted(false);
        setFeedback('');
      }, 300);
    }
  }, [isOpen]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (feedback.trim().length === 0) return;
    console.log('Feedback submitted:', feedback);
    // Here you would typically send the feedback to a server.
    // For this demo, we'll just simulate success.
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000); // Auto-close after 2 seconds
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div 
        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-lg p-8 transform transition-all duration-300 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <h2 id="feedback-modal-title" className="text-2xl font-bold text-slate-100 mb-4">Send Feedback</h2>
            <p className="text-slate-400 mb-6">We'd love to hear your thoughts! Let us know what you think or if you've found a bug.</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your feedback here..."
              className="w-full h-32 p-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              required
              aria-label="Feedback input"
            />
            <div className="flex justify-end items-center mt-6 space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 text-sm font-semibold text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={feedback.trim().length === 0}
                className="py-2 px-5 text-sm font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center flex flex-col items-center justify-center h-48">
            <CheckIcon className="w-16 h-16 text-green-500 bg-green-500/10 rounded-full p-3 mb-4" />
            <h2 className="text-2xl font-bold text-slate-100">Thank you!</h2>
            <p className="text-slate-400 mt-2">Your feedback has been submitted.</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-slide-in-up {
          animation: slide-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FeedbackModal;
