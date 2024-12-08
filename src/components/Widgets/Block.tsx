import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import apiClient, { useAxios } from "@/lib/utils";
import { IoReload } from "react-icons/io5";

type YearData = {
  DomenicheSabatiMattina: number;
  Mattina: number;
  Pomeriggio: number;
  Notte: number;
  Anno: number;
};

export interface DataConteggio {
  Nome: string;
  Values: YearData[];
}

export type Azienda =
  | "Policlinico"
  | "Pisa"
  | "Garibaldi"
  | "Marche"
  | undefined;

interface BlockProps {
  file: File;
}

type DataDifferenziale = {
  Nome: string;
  entrate: number;
  uscite: number;
};
 
function Differenziale({ file }: BlockProps) {

  const calculateDifferenziale = async () => {
    const formData = new FormData();
    formData.append("file", file);
     
     const res =  await apiClient.post(`/api/differenziale`, formData, {  })
      return  await res.data
      
  };
 
  const [InfoDifferenziale, riCalcolaDifferenziale] = useAxios<DataDifferenziale | null>(
    null, calculateDifferenziale, []
  );

  const differenziale = InfoDifferenziale.data

  return (
    <div className=" text-white">
      
      <h3 className=" bg-slate-800 p-1 px-3">{differenziale?.Nome}</h3>
      <Table className="overflow-hidden bg-slate-800 ">
        <TableHeader className="w-full">
          <TableRow className="">
            <TableHead className=" text-center ">Entrate</TableHead>
            <TableHead className=" text-center  ">Uscite</TableHead>
            <TableHead className="text-center  ">Totale</TableHead>
          </TableRow>
        </TableHeader>
        { InfoDifferenziale.state === "success" && differenziale && <TableBody>
          <TableRow className=" text-white text-center">
            <TableCell>{differenziale?.entrate}</TableCell>

            <TableCell>{differenziale?.uscite}</TableCell>
            <TableCell>
              {differenziale?.entrate + differenziale?.uscite}
            </TableCell>
          </TableRow>{" "}
        </TableBody>}
      </Table>
      <div className=" p-3">
        
      {InfoDifferenziale.state === "loading" && <LoadingSpinner className=" text-slate-900" />}
      {InfoDifferenziale.state === "error" && (
          <p className="text-red-500 mt-2">{ InfoDifferenziale.error as string}</p>
        )}
        {InfoDifferenziale.state === "success" && (
          <p className="text-green-500 mt-2">Calcolo Completato</p>
        )}
        <Button className="mt-4 bg-blue-500" onClick={riCalcolaDifferenziale}>
          Calcola Differenziale
        </Button>
         
      </div>
    </div>
  );
}

function Conteggio({ file }: BlockProps) {
 

  const [aziendeDisponibiliInfo, fetchAziendeDisponibili] = useAxios( [], async ()=>{
     return await ( await apiClient.get<string[]>("/api/aziende") ).data 
  }, []  )
 
  useEffect(() => { 
    fetchAziendeDisponibili();
 }, [fetchAziendeDisponibili]);
 
  const [Azienda, setAzienda] = useState<string>();

  const [Infoconteggio, fetchConteggio, setConteggio ] = useAxios<DataConteggio>( {
    Nome: file.name,
    Values: [],
  }, async ()=>{
   if (! Azienda){
    throw "Seleziona un'azienda prima di procedere"
   }
    const formData = new FormData();
    formData.append("file", file);
    const response = (await apiClient.post<DataConteggio>(`/api/conteggio/${Azienda}`, formData)).data;
    return response
    
  }, [Azienda, file.name]  ) 
  

  useEffect(()=>{
    if(Azienda){
      fetchConteggio()
    }
  }, [Azienda])
  const Totale = useMemo(
    () => Infoconteggio.data.Values.reduce(
        (prev, curr) => ({
          Mattina: prev.Mattina + curr.Mattina,
          Notte: prev.Notte + curr.Notte,
          Pomeriggio: prev.Pomeriggio + curr.Pomeriggio,
          DomenicheSabatiMattina:
            prev.DomenicheSabatiMattina + curr.DomenicheSabatiMattina,
          Anno: 0,
        }),
        {
          Mattina: 0,
          Notte: 0,
          Pomeriggio: 0,
          DomenicheSabatiMattina: 0,
          Anno: 0,
        }
      )  ,
    [Infoconteggio.data]
  );

  return (
    <div>
    <h3 className=" bg-slate-800 p-1 px-3 text-white">{ Infoconteggio.state === "success" && Infoconteggio.data?.Nome}</h3>

      <Table className="overflow-hidden bg-slate-800 ">
        <TableHeader className="w-full">
          <TableRow>
            <TableHead className="text-white text-center">Anno</TableHead>
            <TableHead className="text-white text-center">Mattine</TableHead>
            <TableHead className="text-white text-center">Pomeriggi</TableHead>
            <TableHead className="text-white text-center">Notti</TableHead>
            <TableHead className="text-white text-center">Domeniche</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-slate-400">
          {Infoconteggio.state === "success" && (Infoconteggio.data as DataConteggio).Values.map(
            ({ Anno, Mattina, Pomeriggio, Notte, DomenicheSabatiMattina }) => (
              <TableRow key={Anno} className="border   marker:">
                <TableCell className="p-2 text-center  ">{Anno}</TableCell>
                <TableCell className="p-2 text-center">
                  {Mattina || 0}
                </TableCell>
                <TableCell className="p-2 text-center">
                  {Pomeriggio || 0}
                </TableCell>
                <TableCell className="p-2 text-center ">{Notte || 0}</TableCell>
                <TableCell className="p-2 text-center">
                  {DomenicheSabatiMattina || 0}
                </TableCell>
                <TableCell className="p-2 text-center">
                  <Button
                    onClick={() => {
                      setConteggio((prev) => {
                        if (!prev || !Array.isArray(prev.Values)) return prev;
                        return {
                          ...prev,
                           
                            Values: prev.Values.filter((value) => value.Anno !== Anno),
                          
                        };
                      });

                    }}
                  >
                    Elimina
                  </Button>
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="">
            <TableCell className="text-center">Totale:</TableCell>
            <TableCell className="text-center">{Totale.Mattina}</TableCell>
            <TableCell className="text-center">{Totale.Pomeriggio}</TableCell>
            <TableCell className="text-center">{Totale.Notte}</TableCell>
            <TableCell className="text-center">
              {Totale.DomenicheSabatiMattina}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="p-3">
        <div className=" my-3">
          {Infoconteggio.state==="loading" && <LoadingSpinner />}
          {Infoconteggio.state === "error" && (
            <p className="text-red-500 mt-2">{Infoconteggio.error as string}</p>
          )}
          {Infoconteggio.state === "success"  && (
            <p className="text-green-500 mt-2"> Conteggio avvenuto con successo </p>
          )}
        </div>
        <Select onValueChange={(value) => setAzienda(value  )}>
          <div className=" flex gap-3"> 
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleziona Azienda" />
          </SelectTrigger>
          <button onClick={ ()=>{
            fetchConteggio()
          }} className= " hover:bg-gray-200 p-3  rounded-lg ">
            <IoReload />
          </button>
          </div>
          <SelectContent>
            {
              aziendeDisponibiliInfo.data.map((a)=>(
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))
            }
            {
              aziendeDisponibiliInfo.data.length > 0 && <SelectItem value={"Pisa"}>Lucca </SelectItem>
 
            }
             
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Block({ file }: BlockProps) {
  const [Operazione, setOperazione] = useState<"conteggio" | "differenziale">(
    "conteggio"
  );
 
  return (
    <div className="m-3 overflow-hidden border  hover:border-slate-700 shadow-xl relative">
    <h2 className=" bg-slate-800 text-white p-1 px-3">{file?.name}</h2>

      {Operazione === "conteggio" ? (
        <Conteggio file={file} />
      ) : (
        <Differenziale file={file} />
      )}

      <div className=" absolute right-3 bottom-3">
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
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default Block;
