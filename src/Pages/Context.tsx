import { createContext } from "react";


export interface BustePagaContextProps {
    sessionId?: string;
    username?: string;
}
 
export const BustePagaContext =  createContext<BustePagaContextProps>({ });
