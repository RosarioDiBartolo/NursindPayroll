import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { backend } from "@/config";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { XIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { value, AnalysisStateInfo, AnalysisState, Year } from "./Year";

type YearData = {
  [year: string]: value; // Specify the index signature type as 'string'
};

export interface AnalysisData {
  Nome: string;
  Values: YearData;
}
 

export type Azienda = undefined | "Policlinico" | "Pisa" | "Garibaldi" | "Marche";
function Block({ Block }: { Block: File }) {
  const [Azienda, setAzienda] = useState<Azienda>();

  const [BlockState, setBlockState] = useState<AnalysisData>({
    Nome: Block.name,
    Values: {},
  });

  const [Status, setStatus] = useState<AnalysisStateInfo>({
    type: "default",
    message: Block.name,
  });

  const analyze = () => {
    const formData = new FormData();
    formData.append(Block.name, Block);
    if (Azienda) {
      const response = backend.path(`/analyze/${Azienda}`).post(formData, {
         headers: {
          "Access-Control-Allow-Origin": "*"
         }
      });

      setStatus((prev) => ({ ...prev, type: "loading" }));

      console.log("Waiting for a response...");

      response
        .then((response) => {
          console.log("Request finished");

          setBlockState(response.data as AnalysisData);
          setStatus({
            type: "success",
            message: "Operazione avvenuta con successo",
          });
        })
        .catch((error) => {
          setStatus({ type: "error", message: error as string });
        });
    }
  };

  console.log(Status);

  const Totale = useMemo(() => {
    const Tot: value = {
      Pomeriggio: 0,
      Mattina: 0,
      Notte: 0,
      DomenicheMattina: 0,
    };

    Object.values(BlockState.Values).forEach((values) => {
      Tot.Pomeriggio = Tot.Pomeriggio || 0 + (values.Pomeriggio || 0);
      Tot.Mattina = Tot.Mattina || 0 + (values.Mattina || 0);
      Tot.Notte = Tot.Notte || 0 + (values.Notte || 0);
      Tot.DomenicheMattina =
        Tot.DomenicheMattina || 0 + (values.DomenicheMattina || 0);
    });

    return Tot;
  }, [BlockState]);
  

  const ConversionTable: Record<AnalysisState, React.ReactNode> = {
    default: "",
    success: (
     <>Operazione completata</>   
    ),
    loading: <LoadingSpinner className="w-full" />,

    error: (
      <span className="flex">
        Errore nel processare i dati... <XIcon className="text-red-700" />{" "}
      </span>
    ),
  };
  return (
    <div className="m-3 overflow-hidden   border-b-0 shadow-lg shadow-slate-400  text-white border-muted border-2">
      <Table className="overflow-hidden bg-slate-800 ">
        <TableCaption className="text-nowrap absolute hover:text-white"></TableCaption>
        <TableHeader className=" w-full">
          <TableRow className=" ">
            <TableHead className="text-white  text-center ">Anno</TableHead>
            <TableHead className="text-white  text-center ">Mattine</TableHead>
            <TableHead className="text-white  text-center ">
              Pomeriggi
            </TableHead>
            <TableHead className="text-white  text-center ">Notti</TableHead>
            <TableHead className="text-white  text-center ">
              Domeniche Mattina
            </TableHead>
            <TableHead className="text-white  text-center ">Azione</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="overflow-hidden bg-slate-500 bg-gradient-to-t from-slate-700 rounded-sm   ">
          {Object.entries(BlockState?.Values).map(([year, values]) => (
            <Year
              key={year}
              year={year}
              values={values}
              Delete={() => {
                // Create a new object without the deleted year
                setBlockState((prev) => {
                  const newValues = { ...prev.Values };
                  delete newValues[year];
                  return { ...prev, Values: newValues };
                });
              }}
            />
          ))}
          <TableRow>
            <TableCell className="text-center">Totale:</TableCell>
            <TableCell className="text-center">
              Mattine: {Totale.Mattina}
            </TableCell>
            <TableCell className="text-center">
              Pomeriggi: {Totale.Pomeriggio}
            </TableCell>
            <TableCell className="text-center">Notti: {Totale.Notte}</TableCell>
            <TableCell className="text-center">
              Domeniche / Sabati Mattina: {Totale.DomenicheMattina}
            </TableCell>

            <TableCell className="text-center">
              {ConversionTable[Status.type]}
            </TableCell>
          </TableRow>
        </TableBody>

        <TableFooter className="bg-slate-800 hover:text-slate-900">
          <TableRow>
            <TableCell>
              <Button
                className="bg-slate-500 bg-gradient-to-t from-slate-700"
                onClick={analyze}
              >
                Richiedi il Conteggio...
              </Button>
            </TableCell>

            <TableCell colSpan={4} className="">
              Conteggi di timbrature (entrata e uscita) per
              <span className="text-yellow-500 mx-1">
                {BlockState.Nome || Block.name}
              </span>
            </TableCell>
            <TableCell>
              <Select onValueChange={(value) => setAzienda(value as Azienda)}>
                <SelectTrigger className="w-[180px] bg-slate-500 bg-gradient-to-t from-slate-700">
                  <SelectValue placeholder="Azienda" />
                </SelectTrigger>
                <SelectContent className="bg-slate-500 bg-gradient-to-t from-slate-700 text-white">
                  <SelectItem value="Policlinico">Policlinico</SelectItem>
                  <SelectItem value="Pisa">Pisa</SelectItem>
                  <SelectItem value="Garibaldi">Garibaldi</SelectItem>
                  <SelectItem value="Marche">Marche</SelectItem>

                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
export default Block;
