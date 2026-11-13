"use client";

import React from "react";
import { useModalContext } from "@/contexts/ModalContext";
import { Modal } from "@/components/ui/modal";

export function ModalContainer() {
  const { activeModals, closeModal } = useModalContext();

  if (activeModals.length === 0) {
    return null;
  }

  return (
    <>
      {activeModals.map((modal) => (
        <Modal key={modal.id} {...modal} onClose={() => closeModal(modal.id)} />
      ))}
    </>
  );
}
