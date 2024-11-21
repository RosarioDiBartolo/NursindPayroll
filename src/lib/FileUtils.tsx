import { Button } from "../components/ui/button";
import { saveAs } from "file-saver";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"; 

export interface FileLike { name: string; content: BlobPart; contentType: string | null; }

interface DownloadFilesProps  {File: FileLike;    }
export function DownloadFile({File}:DownloadFilesProps  ) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            onClick={() => {
              if (File) {
                const blob = new Blob([File.content], {
                  type: (File.contentType) || "text/plain",
                });
                saveAs(blob, File.name);
              }
            }}
            className="bg-green-700 text-white  focus:outline-none"
          >
            Scarica... {}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Scarica il file "{File.name}"</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

 