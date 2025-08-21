export { Modal } from "../ui/modal";
export { ModalContainer } from "../ModalContainer";
export { ModalExample } from "../ModalExample";
export { ModalProvider } from "../../contexts/ModalContext";
export { useModal } from "../../hooks/use-modal";
export type {
  ModalData,
  ModalContextType,
  ModalProps,
} from "../../types/modal";

// Form Components
export { StudentForm } from "./StudentForm";
export { CourseForm } from "./CourseForm";
export { ModuleForm } from "./ModuleForm";
export { SyllabusForm } from "./SyllabusForm";
export { ClassForm } from "./ClassForm";
export { BulkAddStudentsModal } from "./BulkAddStudentsModal";

// Dialog Components
export {
  ConfirmationDialog,
  DeleteConfirmation,
  SuccessDialog,
  InfoDialog,
} from "./ConfirmationDialog";

// Example Component
export { ModalExamples } from "./ModalExamples";
