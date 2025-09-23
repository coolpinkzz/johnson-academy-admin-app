"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { IModule, IModuleResource } from "@/types/module";
import { getSyllabus } from "@/services/syllabus";
import { useModal } from "../modal";

interface ModuleFormProps {
  onSubmit: (data: IModule) => void;
  onCancel?: () => void;
  initialData?: Partial<IModule>;
  submitLabel?: string;
  cancelLabel?: string;
}

export function ModuleForm({
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel = "Create Module",
  cancelLabel = "Cancel",
}: ModuleFormProps) {
  const { closeModal } = useModal();
  const [formData, setFormData] = useState<IModule>({
    syllabusId: initialData.syllabusId || "",
    type: initialData.type || "theory",
    title: initialData.title || "",
    description: initialData.description || "",
    session: initialData.session || 1,
    resources: initialData.resources || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newResource, setNewResource] = useState<IModuleResource>({
    file: "",
    key: "",
  });

  // Syllabus state
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [isLoadingSyllabi, setIsLoadingSyllabi] = useState(false);

  const moduleTypes = [
    { value: "theory", label: "Theory" },
    { value: "technical", label: "Technical" },
    { value: "learning", label: "Learning" },
    { value: "others", label: "Others" },
  ];

  // Fetch syllabi on component mount
  useEffect(() => {
    const fetchSyllabi = async () => {
      setIsLoadingSyllabi(true);
      try {
        const response = await getSyllabus();
        setSyllabi(response.results || response || []);
      } catch (error) {
        console.error("Error fetching syllabi:", error);
        setSyllabi([]);
      } finally {
        setIsLoadingSyllabi(false);
      }
    };

    fetchSyllabi();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Module title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Module description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.type) {
      newErrors.type = "Module type is required";
    }

    if (formData.session < 1) {
      newErrors.session = "Session number must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
      closeModal();
    }
  };

  const handleInputChange = (field: keyof IModule, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addResource = () => {
    if (newResource.file.trim() && newResource.key.trim()) {
      setFormData((prev) => ({
        ...prev,
        resources: [...prev.resources, { ...newResource }],
      }));
      setNewResource({ file: "", key: "" });
    }
  };

  const removeResource = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Syllabus
        </label>
        <select
          value={formData.syllabusId}
          onChange={(e) => handleInputChange("syllabusId", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.syllabusId ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isLoadingSyllabi}
        >
          <option value="">
            {isLoadingSyllabi ? "Loading syllabi..." : "Select a syllabus"}
          </option>
          {syllabi.map((syllabus) => (
            <option key={syllabus._id} value={syllabus._id}>
              {syllabus.title}
            </option>
          ))}
        </select>
        {errors.syllabusId && (
          <p className="text-sm text-red-600 mt-1">{errors.syllabusId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Module Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter module title"
        />
        {errors.title && (
          <p className="text-sm text-red-600 mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Module Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) =>
            handleInputChange(
              "type",
              e.target.value as "theory" | "technical" | "learning" | "others"
            )
          }
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.type ? "border-red-500" : "border-gray-300"
          }`}
        >
          {moduleTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="text-sm text-red-600 mt-1">{errors.type}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter module description"
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Session Number *
        </label>
        <input
          type="number"
          value={formData.session}
          onChange={(e) =>
            handleInputChange("session", parseInt(e.target.value))
          }
          min="1"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.session ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter session number"
        />
        {errors.session && (
          <p className="text-sm text-red-600 mt-1">{errors.session}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resources
        </label>

        {/* Existing Resources */}
        {formData.resources.length > 0 && (
          <div className="space-y-2 mb-3">
            {formData.resources.map((resource, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
              >
                <span className="text-sm text-gray-600 flex-1">
                  <strong>File:</strong> {resource.file} | <strong>Key:</strong>{" "}
                  {resource.key}
                </span>
                <button
                  type="button"
                  onClick={() => removeResource(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Resource */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newResource.file}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                resources: [
                  ...prev.resources,
                  { file: e.target.value, key: "" },
                ],
              }))
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="File name/URL"
          />
          <input
            type="text"
            value={newResource.key}
            onChange={(e) =>
              setNewResource((prev) => ({ ...prev, key: e.target.value }))
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Resource key"
          />
          <Button
            type="button"
            onClick={addResource}
            disabled={!newResource.file.trim() || !newResource.key.trim()}
            size="sm"
            className="px-3"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => {})}
          className="px-4 py-2"
        >
          {cancelLabel}
        </Button>
        <Button type="submit" className="px-4 py-2">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
