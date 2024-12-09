import  { ReactNode, useEffect } from 'react'
import { taskContext } from './task-context'
import apiClient, { useAxios } from '../utils';
function TasksProvider({ children }: {children: ReactNode}) {
  
  
     const [aziendeDisponibiliInfo, fetchAziendeDisponibili] = useAxios( [], async ()=>{
        return await ( await apiClient.get<string[]>("/api/aziende") ).data 
     }, []  )
    
     useEffect(() => { 
       fetchAziendeDisponibili();
    }, [fetchAziendeDisponibili]);
    return (
    <taskContext.Provider value={{ aziendeDisponibili: aziendeDisponibiliInfo.data}}>
        {children}
    </taskContext.Provider>
   )
}

export default TasksProvider