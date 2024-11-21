import { createContext } from "react";


export interface BustePagaContextProps {
    Cookies?: object;
    username?: string;
}
 
export const BustePagaContext =  createContext<BustePagaContextProps>({ });