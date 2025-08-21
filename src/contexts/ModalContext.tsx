"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { ModalContextType, ModalData } from "@/types/modal";

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModals, setActiveModals] = useState<ModalData[]>([]);

  const openModal = useCallback((modalData: Omit<ModalData, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newModal: ModalData = {
      ...modalData,
      id,
      size: modalData.size || "md",
      closeOnOverlayClick: modalData.closeOnOverlayClick ?? true,
      closeOnEscape: modalData.closeOnEscape ?? true,
      showCloseButton: modalData.showCloseButton ?? true,
    };

    setActiveModals((prev) => [...prev, newModal]);
    return id;
  }, []);

  const closeModal = useCallback((id?: string) => {
    if (!id) {
      // Close all modals when no id is provided
      setActiveModals((prev) => {
        prev.forEach((modal) => {
          if (modal.onClose) {
            modal.onClose();
          }
        });
        return [];
      });
      return;
    }

    // Close specific modal when id is provided
    setActiveModals((prev) => {
      const modal = prev.find((m) => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setActiveModals((prev) => {
      prev.forEach((modal) => {
        if (modal.onClose) {
          modal.onClose();
        }
      });
      return [];
    });
  }, []);

  const isModalOpen = useCallback(
    (id: string) => {
      return activeModals.some((modal) => modal.id === id);
    },
    [activeModals]
  );

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const topModal = activeModals[activeModals.length - 1];
        if (topModal?.closeOnEscape) {
          closeModal(topModal.id);
        }
      }
    };

    if (activeModals.length > 0) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modals are open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (activeModals.length === 0) {
        document.body.style.overflow = "unset";
      }
    };
  }, [activeModals, closeModal]);

  const value: ModalContextType = {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    activeModals,
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModalContext must be used within a ModalProvider");
  }
  return context;
}
