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
import   { AxiosError } from "axios";
import apiClient from "@/lib/utils";

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
interface AnalysisStateInfo<T>{
  message: T| string;
  type: "loading" | "default" | "success" | "error";
}
function Differenziale({ file }: BlockProps) {
  const [Status, setStatus] = useState<AnalysisStateInfo<DataDifferenziale>>({
    type: "default",
    message: "Pronto a calcolare il differenziale",
  });
  const [differenziale, setDifferenziale] = useState<DataDifferenziale | null>(
    null
  );

  const calculateDifferenziale = () => {
    const formData = new FormData();
    formData.append("file", file);

    setStatus({ type: "loading", message: "Calcolo in corso..." });

    apiClient
      .post(`/api/differenziale/Policlinico`, formData)
      .then((response) => {
        setDifferenziale(response.data);
        setStatus({ type: "success", message: "Calcolo completato" });
      })
      .catch((error) => {
        setStatus({ type: "error", message: `Errore: ${error.message}` });
      });
  };

  return (
    <div className=" text-white">
      <h2 className=" bg-slate-800 p-1 px-3">{differenziale?.Nome}</h2>
      <Table className="overflow-hidden bg-slate-800 ">
        <TableHeader className="w-full">
          <TableRow className="">
            <TableHead className=" text-center ">Entrate</TableHead>
            <TableHead className=" text-center  ">Uscite</TableHead>
            <TableHead className="text-center  ">Totale</TableHead>
          </TableRow>
        </TableHeader>
        { differenziale && <TableBody>
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
        <Button className="mt-4 bg-blue-500" onClick={calculateDifferenziale}>
          Calcola Differenziale
        </Button>
        {Status.type === "loading" && <LoadingSpinner />}
        {Status.type === "error" && (
          <p className="text-red-500 mt-2">{Status.message as string}</p>
        )}
        {Status.type === "success" && (
          <p className="text-green-500 mt-2">{Status.message as string}</p>
        )}
      </div>
    </div>
  );
}

function Conteggio({ file }: BlockProps) {
  const [aziendeDisponibili, setAziendeDisponibili ]  = useState<string[]>([])
  useEffect(()=>{
    const fetchAziende = async ()=>{
      setAziendeDisponibili( (await apiClient.get("/api/aziende")).data )

    }

    fetchAziende
   },[])
  const [Azienda, setAzienda] = useState<string>();
  const [conteggio, setConteggio] = useState<DataConteggio>({
    Nome: file.name,
    Values: [],
  });
  const [Status, setStatus] = useState<AnalysisStateInfo<DataConteggio>>({
    type: "default",
    message: file.name,
  });

  const analyze = async () => {
    if (!Azienda) {
      setStatus({
        type: "error",
        message: "Seleziona un'azienda prima di procedere",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus({ type: "loading", message: "Analisi in corso..." });
      const response = await apiClient.post(`/api/conteggio/${Azienda}`, formData);
      setConteggio(response.data);
      setStatus({
        type: "success",
        message: "Operazione completata con successo",
      })

    }catch (err: unknown) {
        if (err instanceof AxiosError) {
          setStatus({ type: "error", message: err.message });        }
        
        else{
          throw err;

        }       
    }}
    
   
  useEffect(() => {
    if (Azienda) {
      analyze();
    }
  }, [Azienda]);

  const Totale = useMemo(
    () =>
      conteggio.Values.reduce(
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
      ),
    [conteggio]
  );

  return (
    <div>
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
          {conteggio.Values.map(
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
                        const newValues = { ...prev.Values };
                        delete newValues[Anno];
                        return { ...prev, Values: newValues };
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
          {Status.type === "loading" && <LoadingSpinner />}
          {Status.type === "error" && (
            <p className="text-red-500 mt-2">{Status.message as string}</p>
          )}
          {Status.type === "success" && (
            <p className="text-green-500 mt-2">{Status.message as string}</p>
          )}
        </div>
        <Select onValueChange={(value) => setAzienda(value  )}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleziona Azienda" />
          </SelectTrigger>
          <SelectContent>
            {
              aziendeDisponibili.map((a)=>(
                <SelectItem key={a} value={a}>{a}</SelectItem>

              ))
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
  console.log(file);

  return (
    <div className="m-3 overflow-hidden border-2 border-slate-700 shadow-lg relative">
      {Operazione === "conteggio" ? (
        <Conteggio file={file} />
      ) : (
        <Differenziale file={file} />
      )}

      <div className=" absolute right-3 bottom-3">
        <Select
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
