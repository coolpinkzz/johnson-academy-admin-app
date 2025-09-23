"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthService from "@/services/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (AuthService.isAuthenticated()) {
      // Force navigate to dashboard if authenticated
      router.push("/dashboard");
    } else {
      // Redirect to login if not authenticated
      router.push("/login");
    }
  }, [router]);

  // Return a loading state while checking authentication
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
