import { OperationsProps } from "@/lib/operations";
import apiClient, { useAxios } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { Button } from "../../ui/button";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "../../ui/table";
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
  

export default function Conteggio({ file, Azienda }: OperationsProps) { 
 
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
      <div className="p-3 flex items-center gap-3 ">
         
      <button
          onClick={ fetchConteggio }
          className=" hover:bg-gray-200 p-3 text-green-500  rounded-lg "
        >
          <IoReload />
        </button>
      
           {Infoconteggio.state==="loading" && <LoadingSpinner />}
          {Infoconteggio.state === "error" && (
            <p className="text-red-500   ">{Infoconteggio.error as string}</p>
          )}
          {Infoconteggio.state === "success"  && (
            <p className="text-green-500  "> Conteggio avvenuto con successo </p>
          )}
          

      </div>
    </div>
  );
}