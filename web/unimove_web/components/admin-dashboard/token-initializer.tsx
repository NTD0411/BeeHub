"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/admin/api";

/**
 * Client component that initializes the API token from localStorage
 * This ensures all API calls made during server-side rendering have access to the token
 * Run this early in the layout so child pages can use the token
 */
export default function TokenInitializer() {
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      apiClient.setToken(token);
    }
  }, []);

  // This component doesn't render anything, just initializes the token
  return null;
}
