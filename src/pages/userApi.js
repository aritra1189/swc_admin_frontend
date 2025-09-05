import { API_BASE_URL } from "../config/api";

// Utility to get token from localStorage or cookies
const getAuthHeaders = () => {
  const token = localStorage.getItem("token"); // or from cookies
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const userAPI = {
  // Get all users with validated limit & offset
  getAllUsers: async (limit = 50, offset = 0) => {
    try {
      // Ensure limit is between 1 and 100
      const validLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
      const validOffset = Math.max(Number(offset) || 0, 0);

      const response = await fetch(
        `${API_BASE_URL}/account/users?limit=${validLimit}&offset=${validOffset}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message || "Failed to fetch users"
        );
      }

      const data = await response.json();
      return data.result || []; // Return the array of users
      
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/account/user/status/${userId}`, {
        method: "put",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
   

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  assignClassAccess: async (userId, className) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/classes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ className }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign class access");
      }

      return await response.json();
    } catch (error) {
      console.error("Error assigning class access:", error);
      throw error;
    }
  },
};