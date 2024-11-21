
import { TableCell, TableRow } from "@/components/ui/table";
import { StateInfo } from "@/lib/utils";

import { Button } from "../ui/button";



export type value = {
  Notte?: number;
  Mattina?: number;
  Pomeriggio?: number;
  DomenicheMattina?: number;

};
 
interface yearRowProps {
  year: string;
  values: value;
  Delete: () => void;
}
export type AnalysisState = "default" | "loading" | "success" | "error";

export type AnalysisStateInfo = StateInfo<AnalysisState>;

export function Year({ year, values, Delete }: yearRowProps) {
  return (
    <TableRow className="border   marker:">
      <TableCell className="p-2 text-center">{year}</TableCell>
      <TableCell className="p-2 text-center">{values.Mattina || 0}</TableCell>
      <TableCell className="p-2 text-center">{values.Pomeriggio || 0}</TableCell>
      <TableCell className="p-2 text-center ">{values.Notte || 0}</TableCell>
      <TableCell className="p-2 text-center">{values.DomenicheMattina || 0}</TableCell>
      <TableCell className="p-2 text-center">
        <Button onClick={Delete}>Elimina</Button>
      </TableCell>
    </TableRow>
  );
}
