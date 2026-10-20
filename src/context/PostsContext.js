import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, imageFile } from "../config/api";
import { useAuth } from "./AuthContext";

const PostsContext = createContext(null);

const EMPTY = { token: null, posts: [], myPosts: [], error: null };

// Loads the posts from the API, so Home (swipe + upload) and Profile (own posts) share them.
export function PostsProvider({ children }) {
  const { token, logout } = useAuth();
  // data.token remembers for which login the posts were loaded
  const [data, setData] = useState(EMPTY);
  const [reloading, setReloading] = useState(false);

  // Returns the new data, or null if the token is not valid anymore.
  const fetchPosts = async () => {
    try {
      const [allPosts, ownPosts] = await Promise.all([
        apiFetch("/posts"),
        apiFetch("/my-posts", { token }),
      ]);
      // The API sends newest first. For swiping we go oldest first,
      // so a new upload shows up at the end of the stack.
      return { token, posts: [...allPosts].reverse(), myPosts: ownPosts, error: null };
    } catch (e) {
      // Token expired or invalid -> back to the login screen
      if (e.status === 401) {
        logout();
        return null;
      }
      return { ...EMPTY, token, error: e.message };
    }
  };

  useEffect(() => {
    if (token) {
      fetchPosts().then((result) => result && setData(result));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadPosts = async () => {
    setReloading(true);
    const result = await fetchPosts();
    if (result) {
      setData(result);
    }
    setReloading(false);
  };

  // Posts of a previous login are never shown.
  const current = data.token === token ? data : EMPTY;
  const loading = Boolean(token) && (data.token !== token || reloading);

  // post: { title, price, location, image: { uri, mimeType } }. image is optional when editing.
  const postForm = (post) => {
    const form = new FormData();
    form.append("title", post.title);
    form.append("price", post.price);
    if (post.location) {
      form.append("location", post.location);
    }
    if (post.image) {
      form.append("image", imageFile(post.image));
    }
    return form;
  };

  const addPost = async (post) => {
    const created = await apiFetch("/posts", { token, body: postForm(post) });
    setData((d) => ({ ...d, posts: [...d.posts, created], myPosts: [created, ...d.myPosts] }));
  };

  // Only own posts. Without a new image the old one stays.
  const updatePost = async (postId, post) => {
    const updated = await apiFetch(`/posts/${postId}`, { token, body: postForm(post), method: "PUT" });
    const replace = (list) => list.map((p) => (p.id === postId ? updated : p));
    setData((d) => ({ ...d, posts: replace(d.posts), myPosts: replace(d.myPosts) }));
  };

  // e.g. when it is sold. Chats about the post stay.
  const deletePost = async (postId) => {
    await apiFetch(`/posts/${postId}`, { token, method: "DELETE" });
    const remove = (list) => list.filter((p) => p.id !== postId);
    setData((d) => ({ ...d, posts: remove(d.posts), myPosts: remove(d.myPosts) }));
  };

  // Liking a post of another user opens a chat with them (the API returns { chatId, created }).
  const likePost = (postId) => apiFetch(`/posts/${postId}/like`, { token, method: "POST" });

  return (
    <PostsContext.Provider
      value={{ posts: current.posts, myPosts: current.myPosts, loading, error: current.error, loadPosts, addPost, updatePost, deletePost, likePost }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
