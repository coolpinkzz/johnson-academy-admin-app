"use client";

import React from "react";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";

export function ModalExample() {
  const { openModal, closeModal } = useModal();

  const handleOpenSimpleModal = () => {
    openModal({
      title: "Simple Modal",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            This is a simple modal with some content. You can put any React
            component here.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => closeModal("")}>
              Cancel
            </Button>
            <Button>Confirm</Button>
          </div>
        </div>
      ),
      size: "md",
    });
  };

  const handleOpenLargeModal = () => {
    openModal({
      title: "Large Modal",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            This is a large modal that demonstrates different sizes and content.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Multiple modal sizes (sm, md, lg, xl, full)</li>
              <li>Close on overlay click</li>
              <li>Close on escape key</li>
              <li>Custom close button</li>
              <li>Prevents body scroll</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => closeModal("")}>
              Close
            </Button>
          </div>
        </div>
      ),
      size: "lg",
    });
  };

  const handleOpenFullWidthModal = () => {
    openModal({
      title: "Full Width Modal",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            This modal takes the full width of the screen and is useful for
            forms or complex content.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => closeModal("")}>
              Cancel
            </Button>
            <Button>Submit</Button>
          </div>
        </div>
      ),
      size: "full",
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Modal Examples</h2>
      <p className="text-gray-600">
        Click the buttons below to see different types of modals in action.
      </p>

      <div className="flex flex-wrap gap-4">
        <Button onClick={handleOpenSimpleModal} variant="default">
          Open Simple Modal
        </Button>

        <Button onClick={handleOpenLargeModal} variant="outline">
          Open Large Modal
        </Button>

        <Button onClick={handleOpenFullWidthModal} variant="secondary">
          Open Full Width Modal
        </Button>
      </div>
    </div>
  );
}
