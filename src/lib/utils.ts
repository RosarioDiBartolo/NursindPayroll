import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from 'axios';
import { useCallback,  useState } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
 
const isDevelopment = import.meta.env.MODE === 'development';

const apiClient = axios.create({
  baseURL: isDevelopment
    ? 'http://127.0.0.1:8080' // Proxy handles this in development
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
export type UseAxiosState<T> = {
  error?: unknown;
  data: T;
  state:  "initial"| "success" | "error" | "loading";
};

export const useAxios = <T>(
  initial: T,
  fetchCallback: () => Promise<T>,
  dependencies: unknown[] = []
): [UseAxiosState<T>, () => Promise<void>, ( action: ( prev: T )=> T )=> void ] => {
  const [res, setRes] = useState<UseAxiosState<T>>({
    data: initial,
    state: "initial",
  });

  const fetchData = useCallback(async () => {
       fetchCallback().then((response)=>{
        
        setRes({ state: "success", data: response });
      }).catch(err => {
         
       setRes( prev =>({
        ...prev,
        state: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      }));
      });

      setRes( prev =>({...prev, state: "loading"}))
        
    }
  , dependencies);

    const setDataRes = (action: (p: T) => T) => {
    setRes((prev) => ({
      ...prev,
      data: action(prev.data)  ,
    }));
  };
  
  return [res, fetchData,  setDataRes ];
};
