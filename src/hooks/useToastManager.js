import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { TOAST_STYLES } from '../utils/constants';

export const useToastManager = () => {
    const [currentToastId, setCurrentToastId] = useState(null);

    // Show a toast with better management to prevent overlapping
    const showManagedToast = (type, message, options = {}) => {
        // Dismiss existing toast if any
        if (currentToastId) {
            toast.dismiss(currentToastId);
        }
        
        // Show new toast
        let newToastId;
        if (type === 'success') {
            newToastId = toast.success(message, options);
        } else if (type === 'error') {
            newToastId = toast.error(message, options);
        }
        
        // Store the new toast ID
        setCurrentToastId(newToastId);
        
        // Clear the toast ID after duration
        const duration = options.duration || 5000;
        setTimeout(() => {
            setCurrentToastId(null);
        }, duration);
        
        return newToastId;
    };

    const showFancyError = (msg) => {
        showManagedToast('error', msg, {
            style: TOAST_STYLES.error,
            iconTheme: {
                primary: '#f59e42',
                secondary: '#fff',
            },
            duration: 4000,
        });
    };

    return {
        showManagedToast,
        showFancyError
    };
};