"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Mock API functions
const fetchPosts = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [
    {
      id: 1,
      title: "Getting Started with React Query",
      content: "Learn the basics of React Query...",
      likes: 42,
    },
    {
      id: 2,
      title: "Advanced Data Fetching",
      content: "Explore advanced patterns...",
      likes: 28,
    },
    {
      id: 3,
      title: "Optimistic Updates",
      content: "Make your app feel faster...",
      likes: 35,
    },
  ];
};

const likePost = async (postId: number) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, postId };
};

export default function PostsExample() {
  const [newPostTitle, setNewPostTitle] = useState("");
  const queryClient = useQueryClient();

  const {
    data: posts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onSuccess: (data) => {
      // Optimistically update the UI
      queryClient.setQueryData(["posts"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: any) =>
          post.id === data.postId ? { ...post, likes: post.likes + 1 } : post
        );
      });
    },
  });

  const handleLike = (postId: number) => {
    likeMutation.mutate(postId);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg">
        <h3 className="text-blue-800 font-semibold mb-4">Posts (Loading...)</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-blue-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-semibold mb-2">Error loading posts</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
      <h3 className="text-purple-800 font-semibold mb-4">
        Posts with React Query
      </h3>

      <div className="space-y-4">
        {posts?.map((post) => (
          <div key={post.id} className="p-4 bg-white rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">{post.title}</h4>
            <p className="text-gray-600 text-sm mb-3">{post.content}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{post.likes} likes</span>
              <button
                onClick={() => handleLike(post.id)}
                disabled={likeMutation.isPending}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {likeMutation.isPending ? "Liking..." : "Like"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-white rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Query Status</h4>
        <div className="text-sm space-y-1">
          <p>
            <span className="font-medium">Posts loaded:</span>{" "}
            {posts?.length || 0}
          </p>
          <p>
            <span className="font-medium">Like mutation:</span>{" "}
            {likeMutation.isPending ? "In progress" : "Idle"}
          </p>
          <p>
            <span className="font-medium">Cache time:</span> 10 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
