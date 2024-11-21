import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios, { AxiosRequestConfig } from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export class Api {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async get(config?: AxiosRequestConfig) {
    return await axios.get(this.endpoint, config);
  }

  async post(data?: object, config?: AxiosRequestConfig) {
    return await axios.post(this.endpoint, data, config);
  }

  path(route: string) {
    const newPath = this.endpoint + route;
    return new Api(newPath);
  }
}

export type StateInfo<T> = {
  message: string | object;
  type: T;
};
export function conditional_class(base: string, value: boolean, ifTrue: string, Else: string = "") {
  return `${base} ${value ? ifTrue : Else}`;
}
 
export type GenericStatus = StateInfo<"unitialized" | "loading" | "success" | "error"> 

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}