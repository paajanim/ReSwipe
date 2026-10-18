import React, { createContext, useContext, useState } from "react";

const PostsContext = createContext(null);

// Holds the posts the user uploaded, so Home (upload) and Profile (list) share them.
export function PostsProvider({ children }) {
  const [myPosts, setMyPosts] = useState([]);

  const addPost = (post) => {
    setMyPosts((posts) => [{ id: Date.now().toString(), ...post }, ...posts]);
  };

  return (
    <PostsContext.Provider value={{ myPosts, addPost }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
