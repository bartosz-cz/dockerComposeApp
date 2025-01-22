import { jwtDecode } from "jwt-decode";
//const API_URL = "http://waska-nowasol.no-ip.org:50324/api";
const API_URL = "http://localhost:5000/api";
async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error text:", errorText); // Log the error text for debugging
    return errorText;
  }

  try {
    return await response.json();
  } catch (err) {
    return response;
  }
}

// User Registration
export async function registerUser(email, password, isAdmin = false) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, is_admin: isAdmin }),
  });
  return handleResponse(response);
}

// User Login
export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(response);

  // Store token in local storage
  if (data.token) {
    const decoded = jwtDecode(data.token);
    data["admin"] = decoded.is_admin || false;
  }
  localStorage.setItem("token", data.token);
  return data;
}

// Get Authenticated User's Ciphers
export async function getCiphers() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/ciphers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

// Create a New Cipher
export async function createCipher(vigenereTableShifts, passwordWord, name) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/ciphers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      vigenere_table_shifts: vigenereTableShifts,
      password_word: passwordWord,
      name: name,
    }),
  });
  return handleResponse(response);
}

// Delete a Cipher
export async function deleteCipher(name) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/ciphers`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: name,
    }),
  });
  return handleResponse(response);
}

// Share a Cipher with Another User
export async function shareCipher(sharedUserEmail, cipherId, canEdit = false) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/shared_ciphers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shared_user_email: sharedUserEmail,
      cipher_id: cipherId,
      can_edit: canEdit,
    }),
  });
  return handleResponse(response);
}

export async function deleteUser(userId) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

// Get Shared Ciphers for Authenticated User
export async function getSharedCiphers() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/shared_ciphers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

// Unshare a Cipher
export async function unshareCipher(SharedWithEmail, cipherName) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/shared_ciphers`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: SharedWithEmail,
      name: cipherName,
    }),
  });
  return handleResponse(response);
}

// Get All Users (Admin Only)
export async function getAllUsers() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

// Check if a User with a Given Email Exists (Admin Only)
export async function checkUserExists(email) {
  const token = localStorage.getItem("token");

  if (!email) {
    throw new Error("Email is required");
  }

  const response = await fetch(
    `${API_URL}/users/exists?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 403) {
    throw new Error("You don't have permission to perform this action");
  }

  return handleResponse(response);
}

// Get Logs (Admin Only)
export async function getLogs() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

// Update User Admin Status (Admin Only)
export async function updateUserAdminStatus(userId, isAdmin) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/users/${userId}/admin`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_admin: isAdmin }),
  });
  return handleResponse(response);
}
