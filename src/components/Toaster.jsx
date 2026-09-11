// Toaster.jsx
import React, { useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ---- Sample notification pool ----
const MESSAGES = [
  { type: 'error',   title: 'Trainer Pooja is Offline',          subtitle: 'Slot 3 · Sales · North region' },
  { type: 'error',   title: 'Trainer Meharban is Offline',       subtitle: 'Slot 5 · Service · South region' },
  { type: 'warning', title: 'Trainer Imtiyaz missed slot start', subtitle: 'Slot 7 · Finance · East region' },
  { type: 'error',   title: 'Trainer Mihir not assigned',        subtitle: 'Slot 2 · CRM · West region' },
];

export function Toaster({ enabled }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let i = 0;
    const fire = () => {
      const msg = MESSAGES[i % MESSAGES.length];
      i++;
      toast(
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 leading-snug">{msg.title}</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">{msg.subtitle}</p>
          </div>
        </div>,
        {
          toastId: `toast-${Date.now()}`,
          type: msg.type,
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'light',
        }
      );
    };

    fire();                              // first toast immediately
    intervalRef.current = setInterval(fire, 8000);  // then every 8 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      limit={1}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="light"
    />
  );
}