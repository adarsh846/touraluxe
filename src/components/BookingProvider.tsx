"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect, useMemo } from "react";


export type ModalView = 'SERVICES' | 'BOOKING' | 'ABOUT' | 'CTA' | 'PACKAGE' | 'PORTAL' | 'CONTACT' | null;

interface PackageData {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string;
  tax_status?: string;
  currency?: string;
  child_price?: string;
  nights?: number;
  duration?: string;
}

interface ModalState {
  view: ModalView;
  data?: any;
  source?: string;
  intent?: string;
}

export interface BookingDetails {
  packageTitle?: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  kids?: number;
  infants?: number;
  totalInvestment?: string;
  isCustom?: boolean;
}

interface BookingContextType {
  isOpen: boolean;
  view: ModalView;
  data: any;
  source: string;
  isClosing: boolean;
  openModal: (view: ModalView, data?: any, source?: string, intent?: string) => void;
  closeModal: () => void;
  // Legacy support for openBooking
  openBooking: (data?: PackageData, source?: string, intent?: string) => void;
  startClosing: () => void;
  goBack: () => void;
  canGoBack: boolean;
  history: ModalState[];
  packageData?: PackageData;
  bookingSource?: string;
  intent?: string;
  error: string | null;
  errorTrigger: number;
  setError: (err: string | null) => void;
  bookingDetails: BookingDetails | null;
  setBookingDetails: (details: BookingDetails | null) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export interface BookingActionsContextType {
  openModal: (view: ModalView, data?: any, source?: string, intent?: string) => void;
  openBooking: (data?: PackageData, source?: string, intent?: string) => void;
  closeModal: () => void;
  startClosing: () => void;
  goBack: () => void;
  setError: (err: string | null) => void;
}

const BookingActionsContext = createContext<BookingActionsContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};

export const useBookingActions = () => {
  const context = useContext(BookingActionsContext);
  if (!context) {
    throw new Error("useBookingActions must be used within a BookingProvider");
  }
  return context;
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ view: null });
  const [history, setHistory] = useState<ModalState[]>([]);

  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  // Refs for stable callbacks
  const stateRef = useRef(modalState);
  const isOpenRef = useRef(isOpen);
  const isClosingRef = useRef(isClosing);

  useEffect(() => { stateRef.current = modalState; }, [modalState]);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { isClosingRef.current = isClosing; }, [isClosing]);

  const [error, setErrorState] = useState<string | null>(null);
  const [errorTrigger, setErrorTrigger] = useState(0);
  
  const setError = useCallback((err: string | null) => {
    setErrorState(err);
    if (err) {
      setErrorTrigger(prev => prev + 1);
      setTimeout(() => setErrorState(null), 5000);
    }
  }, []);

  // ── History API: hardware back button support ──────────────────────────────
  // We track whether we have pushed a fake history entry so we don't double-push.
  const hasPushedHistoryRef = useRef(false);
  // Ref to always hold the latest history for use in event handlers (avoids stale closures)
  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);

  // When the modal opens for the first time, push a fake state so the
  // hardware back button fires `popstate` instead of leaving the page.
  const openModal = useCallback((view: ModalView, data?: any, source: string = "GENERAL_INQUIRY", intent?: string) => {
    setErrorState(null);
    if (isOpenRef.current && stateRef.current.view && stateRef.current.view !== view) {
      const currentState = stateRef.current;
      setHistory(prev => [...prev, currentState]);
    } else if (!isOpenRef.current) {
      setHistory([]);
      // Push a fake entry so the HW back button fires popstate
      if (!hasPushedHistoryRef.current) {
        window.history.pushState({ ...window.history.state, touraluxeModal: true }, '');
        hasPushedHistoryRef.current = true;
      }
    }
    
    setModalState({ view, data, source, intent });
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  const goBack = useCallback(() => {
    setErrorState(null);
    setHistory(prevHistory => {
      if (prevHistory.length > 0) {
        const lastState = prevHistory[prevHistory.length - 1];
        setModalState(lastState);
        return prevHistory.slice(0, -1);
      }
      return prevHistory;
    });
  }, []);

  const openBooking = useCallback((data?: PackageData, source: string = "GENERAL_INQUIRY", intent?: string) => {
    openModal('BOOKING', data, source, intent);
  }, [openModal]);

  const startClosing = useCallback(() => {
    if (isOpenRef.current && !isClosingRef.current) {
        setIsClosing(true);
        setErrorState(null);
    }
  }, []);

  const closeModal = useCallback(() => {
    isOpenRef.current = false; // Disable popstate intercept immediately to prevent race conditions during popstate events
    // If we pushed a fake history entry, clean it up silently
    if (hasPushedHistoryRef.current) {
      hasPushedHistoryRef.current = false;
      // Only go back if the current state is our fake one (avoid double-back)
      if (window.history.state?.touraluxeModal) {
        window.history.back();
      }
    }
    setIsOpen(false);
    setIsClosing(false);
    setModalState({ view: null });
    setHistory([]);
    setErrorState(null);
    setBookingDetails(null);
  }, []);

  // ── popstate: intercept HW back button ────────────────────────────────────
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Only intercept if our modal is open
      if (!isOpenRef.current) return;

      // Read from ref to avoid stale closure over history state
      if (historyRef.current.length > 0) {
        // Prevent the browser from actually navigating away
        // Re-push so the back button still works if pressed again
        window.history.pushState({ ...window.history.state, touraluxeModal: true }, '');
        // Navigate back within modal history
        goBack();
      } else {
        // No more modal history — close the modal
        // Let the browser's back navigation happen naturally (no re-push)
        setIsClosing(true);
        setErrorState(null);
        hasPushedHistoryRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [goBack]);

  const contextValue = useMemo(() => ({ 
    isOpen, 
    view: modalState.view, 
    data: modalState.data, 
    source: modalState.source || "GENERAL_INQUIRY",
    isClosing, 
    openModal, 
    closeModal, 
    openBooking, 
    startClosing,
    goBack,
    canGoBack: history.length > 0,
    history,
    packageData: modalState.view === 'BOOKING' ? modalState.data : undefined,
    bookingSource: modalState.source,
    intent: modalState.intent,
    error,
    errorTrigger,
    setError,
    bookingDetails,
    setBookingDetails
  }), [isOpen, modalState, isClosing, history, openModal, closeModal, openBooking, startClosing, goBack, error, errorTrigger, setError, bookingDetails, setBookingDetails]);

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

