"use client";

import React from "react";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";
import {
  StudentForm,
  CourseForm,
  DeleteConfirmation,
  SuccessDialog,
  InfoDialog,
} from "./index";

export function ModalExamples() {
  const { openModal, closeModal } = useModal();

  const handleStudentSubmit = (data: any) => {
    console.log("Student data:", data);
    // Here you would typically make an API call
    openModal({
      title: "Success",
      content: (
        <SuccessDialog
          title="Student Added Successfully"
          message={`Student ${data.firstName} ${data.lastName} has been added to the system.`}
          onConfirm={() => closeModal("")}
        />
      ),
      size: "sm",
      showCloseButton: false,
      closeOnOverlayClick: false,
      closeOnEscape: false,
    });
  };

  const handleCourseSubmit = (data: any) => {
    console.log("Course data:", data);
    openModal({
      title: "Success",
      content: (
        <SuccessDialog
          title="Course Created Successfully"
          message={`Course "${data.name}" has been created successfully.`}
          onConfirm={() => closeModal("")}
        />
      ),
      size: "sm",
      showCloseButton: false,
      closeOnOverlayClick: false,
      closeOnEscape: false,
    });
  };

  const handleDeleteStudent = () => {
    openModal({
      title: "Confirm Deletion",
      content: (
        <DeleteConfirmation
          itemName="John Doe"
          onConfirm={() => {
            console.log("Student deleted");
            closeModal("");
            // Show success message
            openModal({
              title: "Success",
              content: (
                <SuccessDialog
                  title="Student Deleted"
                  message="Student John Doe has been successfully deleted from the system."
                  onConfirm={() => closeModal("")}
                />
              ),
              size: "sm",
              showCloseButton: false,
              closeOnOverlayClick: false,
              closeOnEscape: false,
            });
          }}
          onCancel={() => closeModal("")}
        />
      ),
      size: "md",
      showCloseButton: false,
      closeOnOverlayClick: false,
      closeOnEscape: false,
    });
  };

  const showInfoDialog = () => {
    openModal({
      title: "Information",
      content: (
        <InfoDialog
          title="System Information"
          message="This is an informational dialog that provides users with important system information or updates."
          onConfirm={() => closeModal("")}
        />
      ),
      size: "md",
      showCloseButton: false,
      closeOnOverlayClick: false,
      closeOnEscape: false,
    });
  };

  const showWarningDialog = () => {
    openModal({
      title: "Warning",
      content: (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-yellow-600">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                System Maintenance
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                The system will be undergoing maintenance from 2:00 AM to 4:00
                AM tomorrow. During this time, some features may be temporarily
                unavailable.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => closeModal("")}
                  className="px-4 py-2"
                >
                  Dismiss
                </Button>
                <Button onClick={() => closeModal("")} className="px-4 py-2">
                  Acknowledge
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
      size: "lg",
      showCloseButton: false,
      closeOnOverlayClick: false,
      closeOnEscape: false,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Modal Component Examples
        </h2>
        <p className="text-gray-600">
          Explore different types of modals and forms available in the system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Form Modals */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Form Modals
          </h3>
          <div className="space-y-3">
            <Button
              onClick={() =>
                openModal({
                  title: "Add New Student",
                  size: "lg",
                  content: (
                    <StudentForm
                      submitLabel="Add Student"
                      cancelLabel="Cancel"
                      type="student"
                    />
                  ),
                  showCloseButton: false,
                  closeOnOverlayClick: false,
                  closeOnEscape: false,
                })
              }
              className="w-full"
            >
              Student Form Modal
            </Button>

            <Button
              onClick={() =>
                openModal({
                  title: "Create New Course",
                  size: "lg",
                  content: (
                    <CourseForm
                      onSubmit={handleCourseSubmit}
                      onCancel={() => closeModal("")}
                    />
                  ),
                  showCloseButton: false,
                  closeOnOverlayClick: false,
                  closeOnEscape: false,
                })
              }
              variant="outline"
              className="w-full"
            >
              Course Form Modal
            </Button>
          </div>
        </div>

        {/* Confirmation Modals */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Confirmation Modals
          </h3>
          <div className="space-y-3">
            <Button
              onClick={handleDeleteStudent}
              variant="destructive"
              className="w-full"
            >
              Delete Confirmation
            </Button>

            <Button
              onClick={showInfoDialog}
              variant="outline"
              className="w-full"
            >
              Info Dialog
            </Button>
          </div>
        </div>

        {/* Custom Modals */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Custom Modals
          </h3>
          <div className="space-y-3">
            <Button
              onClick={showWarningDialog}
              variant="outline"
              className="w-full"
            >
              Warning Dialog
            </Button>

            <Button
              onClick={() =>
                openModal({
                  title: "Custom Content Modal",
                  size: "xl",
                  content: (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-2">
                          Welcome to Johnson Academy
                        </h3>
                        <p className="text-blue-100">
                          This is a custom modal with rich content, gradients,
                          and custom styling.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Feature 1
                          </h4>
                          <p className="text-sm text-gray-600">
                            Advanced student management
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Feature 2
                          </h4>
                          <p className="text-sm text-gray-600">
                            Comprehensive reporting
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => closeModal("")}
                        >
                          Close
                        </Button>
                        <Button onClick={() => closeModal("")}>
                          Get Started
                        </Button>
                      </div>
                    </div>
                  ),
                })
              }
              className="w-full"
            >
              Custom Content
            </Button>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
        <div className="text-blue-800 space-y-2 text-sm">
          <p>
            • <strong>Form Modals:</strong> Use for data input with validation
          </p>
          <p>
            • <strong>Confirmation Modals:</strong> Use for user confirmations
            and alerts
          </p>
          <p>
            • <strong>Custom Modals:</strong> Use for complex content and
            layouts
          </p>
          <p>
            • <strong>Modal Sizes:</strong> sm, md, lg, xl, full
          </p>
          <p>
            • <strong>Close Behavior:</strong> Customize overlay click, escape
            key, and close button
          </p>
        </div>
      </div>
    </div>
  );
}
