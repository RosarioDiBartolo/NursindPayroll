import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
 
const isDevelopment = import.meta.env.MODE === 'development';

const apiClient = axios.create({
  baseURL: isDevelopment
    ? '/http://127.0.0.1:8080' // Proxy handles this in development
    : 'https://nursindbackend.onrender.com', // Direct URL in production
});

export default apiClient;
 
export type StateInfo<T> = {
  message: string | object;
  type: T;
};
 
export type GenericStatus = StateInfo<"unitialized" | "loading" | "success" | "error"> 

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}