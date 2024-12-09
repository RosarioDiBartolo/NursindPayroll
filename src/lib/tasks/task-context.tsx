import { createContext } from "react";

export const taskContext = createContext<{
    aziendeDisponibili: string[]
}>( {
    aziendeDisponibili: []
})



