// src/interfaces.ts

export interface User {
    id: number;
    email: string;
    name: string | null; 
    password: string;
  }
  
  export interface Post {
    id: number;
    title: string;
    content: string | null; 
    published: boolean;
    authorId: number | null; 
  }
  