import {  OperationsProps } from "@/lib/operations";
import apiClient, { useAxios } from "@/lib/utils";
import { Button } from "../../ui/button";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../ui/table";

 
  
  type DataDifferenziale = {
    Nome: string;
    entrate: number;
    uscite: number;
  };
   
  export default function Differenziale({ file, }: OperationsProps) {
  
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
  