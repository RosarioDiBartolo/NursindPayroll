import { taskContext } from "@/lib/tasks/task-context";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";



 



import {   useContext, useState } from "react";
 

export const useAzienda = () => {
  const [Azienda, setAzienda] = useState<string>();

  return { Azienda, setAzienda };
};

function AziendaSelector({
   setAzienda,
 }: ReturnType<typeof useAzienda>) {
  const { aziendeDisponibili } = useContext(taskContext);
  return (
    <Select onValueChange={(value) => setAzienda(value === "Lucca"? "Pisa": value)}>
         <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleziona Azienda" />
        </SelectTrigger>
        
      <SelectContent className="">
        {aziendeDisponibili.map((a) => (
          <SelectItem key={a} value={a}>
            {a}
          </SelectItem>
        ))}
        {aziendeDisponibili.length > 0 && (
          <SelectItem value={"Lucca"}>Lucca </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

export default AziendaSelector;
