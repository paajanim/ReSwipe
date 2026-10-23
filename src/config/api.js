import { File } from "expo-file-system";

// Address of the ReSwipe API. Can be overridden with EXPO_PUBLIC_API_URL in .env.local
// (e.g. http://192.168.1.20:3000 to test against the API running on your Mac).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://reswipe.ipv64.de";

// The API returns image paths like "/uploads/abc.jpg".
export const imageUrl = (path) => `${API_URL}${path}`;

// Turns an expo-image-picker asset into a File for FormData.
// In Expo 57 the global fetch is expo/fetch, which uploads files as Blob (File)
// and not as the old React Native { uri, name, type } object.
export const imageFile = (asset) => new File(asset.uri);

// Small wrapper around fetch: sends JSON (or FormData), adds the login token
// and throws an Error with the message from the API if the request fails.
export async function apiFetch(path, { token, body, method } = {}) {
  const headers = {};
  let payload = bod;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // FormData (image upload) sets its own Content-Type, JSON needs it explicitly.
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method: method ?? (body ? "POST" : "GET"), headers, body: payload });
  } catch {
    throw new Error("No connection to the server.");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error ?? `Request failed (${res.status}).`);
    error.status = res.status;
    throw error;
  }

  return data;
}
