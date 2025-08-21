export interface ModalData {
  id: string;
  title?: string;
  content: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export interface ModalContextType {
  openModal: (modalData: Omit<ModalData, "id">) => string;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;
  activeModals: ModalData[];
}

export interface ModalProps extends ModalData {
  onClose: () => void;
}
