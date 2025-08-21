import { useModalContext } from "@/contexts/ModalContext";
import { ModalData } from "@/types/modal";
import { useCallback } from "react";

export function useModal() {
  const { openModal, closeModal, closeAllModals, isModalOpen, activeModals } =
    useModalContext();

  const openModalWithDefaults = useCallback(
    (modalData: Omit<ModalData, "id">) => {
      return openModal({
        size: "md",
        closeOnOverlayClick: true,
        closeOnEscape: true,
        showCloseButton: true,
        ...modalData,
      });
    },
    [openModal]
  );

  return {
    openModal: openModalWithDefaults,
    closeModal,
    closeAllModals,
    isModalOpen,
    activeModals,
  };
}
