"use client";

import { useQuery } from "@tanstack/react-query";

// Mock API function - replace with your actual API calls
const fetchUser = async (userId: number) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock user data
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Moderator" },
  ];

  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export default function UserExample() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user", 1],
    queryFn: () => fetchUser(1),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-semibold mb-2">Error loading user</h3>
        <p className="text-red-600 text-sm mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-green-800 font-semibold mb-4">
        User Data (React Query Example)
      </h3>
      <div className="space-y-2">
        <p>
          <span className="font-medium">ID:</span> {user?.id}
        </p>
        <p>
          <span className="font-medium">Name:</span> {user?.name}
        </p>
        <p>
          <span className="font-medium">Email:</span> {user?.email}
        </p>
        <p>
          <span className="font-medium">Role:</span> {user?.role}
        </p>
      </div>
      <button
        onClick={() => refetch()}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        Refresh Data
      </button>
    </div>
  );
}
