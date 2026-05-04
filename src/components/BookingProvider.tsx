"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect, useMemo } from "react";


export type ModalView = 'SERVICES' | 'BOOKING' | 'ABOUT' | 'CTA' | 'PACKAGE' | null;

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
  data?: unknown;
  source?: string;
}

interface BookingContextType {
  isOpen: boolean;
  view: ModalView;
  data: unknown;
  source: string;
  isClosing: boolean;
  openModal: (view: ModalView, data?: unknown, source?: string) => void;
  closeModal: () => void;
  // Legacy support for openBooking
  openBooking: (data?: PackageData, source?: string) => void;
  startClosing: () => void;
  goBack: () => void;
  canGoBack: boolean;
  packageData?: PackageData;
  bookingSource?: string;
  error: string | null;
  errorTrigger: number;
  setError: (err: string | null) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ view: null });
  const [history, setHistory] = useState<ModalState[]>([]);

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

  const openModal = useCallback((view: ModalView, data?: unknown, source: string = "GENERAL_INQUIRY") => {
    setErrorState(null); // Clear errors on view change
    if (isOpenRef.current && stateRef.current.view && stateRef.current.view !== view) {
      const currentState = stateRef.current;
      setHistory(prev => [...prev, currentState]);
    } else if (!isOpenRef.current) {
      setHistory([]);
    }
    
    setModalState({ view, data, source });
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

  const openBooking = useCallback((data?: PackageData, source: string = "GENERAL_INQUIRY") => {
    openModal('BOOKING', data, source);
  }, [openModal]);

  const startClosing = useCallback(() => {
    if (isOpenRef.current && !isClosingRef.current) {
        setIsClosing(true);
        setErrorState(null);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIsClosing(false);
    setModalState({ view: null });
    setHistory([]);
    setErrorState(null);
  }, []);

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
    packageData: modalState.view === 'BOOKING' ? modalState.data : undefined,
    bookingSource: modalState.source,
    error,
    errorTrigger,
    setError
  }), [isOpen, modalState, isClosing, history.length, openModal, closeModal, openBooking, startClosing, goBack, error, errorTrigger, setError]);

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

