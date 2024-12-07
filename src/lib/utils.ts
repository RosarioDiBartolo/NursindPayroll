import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

 
export type StateInfo<T> = {
  message: string | object;
  type: T;
};
 
export type GenericStatus = StateInfo<"unitialized" | "loading" | "success" | "error"> 

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}