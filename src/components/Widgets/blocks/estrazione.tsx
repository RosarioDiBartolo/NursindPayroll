import { OperationsProps } from "@/lib/operations";
 
import apiClient from "@/lib/utils";
import * as Tooltip from "@/components/ui/tooltip";
import { BsFiletypeCsv } from "react-icons/bs";

function Estrazione({ file, Azienda }: OperationsProps) {
 
  const download = async ( what :string ) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post(`/api/parse/${Azienda}/${what}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob", // Ensure response is treated as binary data
      });

      // Handle CSV download
      const blob = new Blob([response.data], { type: "text/csv" });
      const _url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = _url;
      link.setAttribute("download", "data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className=" p-3 flex flex-col gap-3 ">
       <div className=" flex gap-3  ">
        {Azienda && (
          <>
            <Tooltip.TooltipProvider>
              <Tooltip.Tooltip>
                <Tooltip.TooltipTrigger className=" text-center" asChild>
                  <div className=" text-black">
                    <button
                      onClick={ ()=> download("full")}
                      className=" hover:bg-gray-200 p-3  rounded-lg "
                    >
                      <BsFiletypeCsv className="  " />
                    </button>
                    <p className="  text-smmx-auto">csv</p>
                  </div>
                </Tooltip.TooltipTrigger>
                <Tooltip.TooltipContent
                  className="TooltipContent"
                  sideOffset={5}
                >
                  Scarica csv completo
                </Tooltip.TooltipContent>
              </Tooltip.Tooltip>
            </Tooltip.TooltipProvider>

            <Tooltip.TooltipProvider>
              <Tooltip.Tooltip>
                <Tooltip.TooltipTrigger className=" text-center" asChild>
                  <div className=" text-green-500 ">
                    <button
                      onClick={()=>download("entrate")}
                      className=" hover:bg-gray-200 p-3  rounded-lg "
                    >
                      <BsFiletypeCsv className="  " />
                    </button>
                    <p className="  text-sm mx-auto">Entrate</p>
                  </div>
                </Tooltip.TooltipTrigger>
                <Tooltip.TooltipContent
                  className="TooltipContent"
                  sideOffset={5}
                >
                  Scarica csv entrate
                </Tooltip.TooltipContent>
              </Tooltip.Tooltip>
            </Tooltip.TooltipProvider>

            <Tooltip.TooltipProvider>
              <Tooltip.Tooltip>
                <Tooltip.TooltipTrigger className=" text-center" asChild>
                  <div className=" text-red-500">
                    <button
                      onClick={()=>download("uscite")}
                      className=" hover:bg-gray-200 p-3  rounded-lg "
                    >
                      <BsFiletypeCsv className="  " />
                    </button>
                    <p className=" text-sm mx-auto">Uscite</p>
                  </div>
                </Tooltip.TooltipTrigger>
                <Tooltip.TooltipContent
                  className="TooltipContent"
                  sideOffset={5}
                >
                  Scarica csv uscite
                </Tooltip.TooltipContent>
              </Tooltip.Tooltip>
            </Tooltip.TooltipProvider>
          </>
        )}
        
      </div>
 
    </div>
  );
}

export default Estrazione;
