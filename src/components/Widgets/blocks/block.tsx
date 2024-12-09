import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Conteggio from "./conteggio";
import Differenziale from "./differenziale";
import Estrazione from "./estrazione";
import FileUploader from "../FileUploader";
import AziendaSelector from "./azienda-selector";

export default function Block() {
  const [files, setFiles] = useState<File[]>([]);
  const [Azienda, setAzienda] = useState<string>( )
  const [Operazione, setOperazione] = useState<
    "conteggio" | "differenziale" | "estrazione"
  >("conteggio");

  const Operation =
    Operazione === "conteggio"
      ? Conteggio
      : Operazione === "differenziale"
      ? Differenziale
      : Estrazione;

  return (
    < >
      
      
      {files.map((f) => (
        <>
          <h3 className=" bg-slate-800 text-white p-1 px-3">{f?.name}</h3>
          <Operation file={f} Azienda={Azienda} key={f.name} />
        </>
      ))}
      
      <div className=" flex flex-wrap  gap-5 items-center p-3 justify-between">
       
        <div className=" flex flex-wrap gap-3" >  
          <AziendaSelector Azienda={Azienda} setAzienda={setAzienda} />
  
         <Select
          defaultValue="conteggio"
          onValueChange={(value) =>
            setOperazione(value as "conteggio" | "differenziale")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleziona Operazione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conteggio">Conteggio</SelectItem>
            <SelectItem value="differenziale">Differenziale</SelectItem>
            <SelectItem value="estrazione">Estrazione</SelectItem>
          </SelectContent>
        </Select>
        </div>        
        <FileUploader multiple className=" text-ms bg-green-300 transition-all hover:bg-green-500 active:bg-green-100 active:text-green-500 px-3 py-2 text-white"  setFiles={setFiles}>
        Seleziona i file per il seguente blocco
      </FileUploader>
      </div>
    </ >
  );
}
