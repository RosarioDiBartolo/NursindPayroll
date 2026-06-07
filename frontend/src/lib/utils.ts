import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
 
const configuredBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
export const baseURL = configuredBaseUrl
  ? `${configuredBaseUrl}/api`
  : "/api";
const apiClient = axios.create({
  baseURL,
});


export default apiClient;
