"use client";

import { DeleteConfirmation } from "@/components/modal/ConfirmationDialog";
import { EditTeamMemberForm } from "@/components/modal/EditTeamMemberForm";
import { TeamMemberForm } from "@/components/modal/TeamMemberForm";
import { useModal } from "@/hooks/use-modal";
import {
  STAFF_ROLE_LABELS,
  STAFF_ROLES,
  StaffRole,
  isStaffRole,
} from "@/lib/rbac";
import { useAuth } from "@/services/auth";
import {
  deleteTeamMember,
  getTeamMembers,
} from "@/services/team";
import { User } from "@/types/user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Search, Trash2, UserCog } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";

function memberUserId(member: User) {
  return member.id || member._id;
}

const roleBadgeClass: Record<StaffRole, string> = {
  master: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  aqsd: "bg-amber-100 text-amber-800",
};

const ManageTeamPage = () => {
  const { openModal, closeModal } = useModal();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | StaffRole>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
  });

  const filteredMembers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) return false;
      if (!query) return true;

      const name = (member.name || "").toLowerCase();
      const email = (member.email || "").toLowerCase();
      const department = (member.department || "").toLowerCase();
      const role = (member.role || "").toLowerCase();
      return (
        name.includes(query) ||
        email.includes(query) ||
        department.includes(query) ||
        role.includes(query)
      );
    });
  }, [members, searchTerm, roleFilter]);

  const handleAdd = () => {
    openModal({
      title: "Add Team Member",
      content: <TeamMemberForm submitLabel="Add member" />,
      size: "lg",
    });
  };

  const handleEdit = (member: User) => {
    openModal({
      title: "Edit Team Member",
      content: (
        <EditTeamMemberForm member={member} submitLabel="Update member" />
      ),
      size: "lg",
    });
  };

  const performDelete = async (member: User) => {
    const userId = memberUserId(member);
    try {
      setDeletingId(userId);
      await deleteTeamMember(userId);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member deleted");
    } catch {
      toast.error("Failed to delete team member. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (member: User) => {
    if (memberUserId(member) === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    openModal({
      title: "Confirm Deletion",
      content: (
        <DeleteConfirmation
          title="Delete Team Member"
          message={`Are you sure you want to delete "${member.name}"? This action cannot be undone.`}
          itemName={member.name}
          onConfirm={() => performDelete(member)}
          onCancel={() => closeModal()}
        />
      ),
      size: "sm",
      closeOnOverlayClick: false,
      closeOnEscape: false,
      showCloseButton: false,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-600">
        Loading team…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        Failed to load team members.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 items-center gap-2 border-b px-4 bg-white">
        <div className="flex items-center justify-between flex-1 px-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-blue-600" />
              Manage Team
            </h1>
            <p className="text-sm text-gray-600">
              Create and update admin, AQSD, and master users
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add member
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, role, department…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "all" | StaffRole)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All roles</option>
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {STAFF_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      {searchTerm.trim() || roleFilter !== "all"
                        ? "No team members match your filters"
                        : "No team members found"}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const id = memberUserId(member);
                    const role = isStaffRole(member.role)
                      ? member.role
                      : null;
                    const isSelf = id === currentUser?.id;

                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {member.profilePicture ? (
                              <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
                                <Image
                                  src={member.profilePicture}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                {member.name?.charAt(0) || "?"}
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.name}
                                {isSelf && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (you)
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {role ? (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${roleBadgeClass[role]}`}
                            >
                              {STAFF_ROLE_LABELS[role]}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.department || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.role === "master"
                            ? "All"
                            : member.branchAccess?.length
                              ? member.branchAccess
                                  .slice()
                                  .sort((a, b) => a - b)
                                  .join(", ")
                              : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              member.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(member)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(member)}
                              disabled={
                                isSelf || deletingId === id
                              }
                              title={
                                isSelf
                                  ? "You cannot delete your own account"
                                  : undefined
                              }
                              className="text-red-600 hover:text-red-800 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              {deletingId === id ? (
                                <>
                                  <span className="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                  Deleting…
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageTeamPage;
