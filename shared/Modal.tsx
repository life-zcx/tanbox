import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface UseModalOptions {
  onClose: () => void;
  isOpen?: boolean;
  closeOnEsc?: boolean;
  closeOnBackdropClick?: boolean;
}

/**
 * Hook providing standard modal behavior:
 * - Esc key closing
 * - Safe backdrop click (does NOT close when selecting/copying text that drags onto backdrop)
 * - Body scroll lock
 */
export function useModalBehavior({
  onClose,
  isOpen = true,
  closeOnEsc = true,
  closeOnBackdropClick = true,
}: UseModalOptions) {
  const isBackdropMouseDown = useRef(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const backdropProps = {
    onMouseDown: (e: React.MouseEvent) => {
      isBackdropMouseDown.current = e.target === e.currentTarget;
    },
    onClick: (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget && isBackdropMouseDown.current) {
        onClose();
      }
      isBackdropMouseDown.current = false;
    },
  };

  const dialogProps = {
    onMouseDown: (e: React.MouseEvent) => {
      e.stopPropagation();
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
    },
  };

  return { backdropProps, dialogProps };
}

export interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string; // Classes for inner modal dialog card
  containerClassName?: string; // Classes for flex container/overlay
  backdropClassName?: string;
  closeOnEsc?: boolean;
  closeOnBackdropClick?: boolean;
  zIndex?: string;
}

/**
 * Standard Tanbox Modal dialog wrapper:
 * - Full-screen backdrop blur (`backdrop-blur-md bg-black/60`)
 * - Esc key closing
 * - Text selection / drag safe (never closes on release if selection started inside modal)
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen = true,
  onClose,
  children,
  className = 'bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative w-full max-w-lg max-h-[92vh] flex flex-col',
  containerClassName = '',
  closeOnEsc = true,
  closeOnBackdropClick = true,
  zIndex = 'z-[99999]',
}) => {
  const { backdropProps, dialogProps } = useModalBehavior({
    isOpen,
    onClose,
    closeOnEsc,
    closeOnBackdropClick,
  });

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      {...backdropProps}
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 ${containerClassName}`}
    >
      <div
        {...dialogProps}
        className={`${className} animate-in zoom-in-95 duration-150`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
