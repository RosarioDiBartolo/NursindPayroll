import { useContext, useState, useEffect, useCallback } from "react";
import FileCrawler, { CrawlState, Mesi,  } from "./FileCrawler";
import { BustePagaContext } from "@/Pages/Context";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { IoStopCircleOutline } from "react-icons/io5";
import { VscDebugStart } from "react-icons/vsc";
import { SaveAllIcon } from "lucide-react";
import apiClient from "@/lib/utils";
 

const Crawler = () => {
  const [filesCrawlState, setFilesCrawlState] = useState<CrawlState[]>([]);
  const [currentMonth, setCurrentMonth] = useState(0);
  const { Cookies, username } = useContext(BustePagaContext);
  const [stop, setStop] = useState(false);

  const crawl = useCallback(
    async (monthIndex: number) => {
      if (monthIndex <= Mesi.length ){
      const [year, month] = Mesi[monthIndex];
      console.log("Crawling for current month: " + year + " " + month);

      setFilesCrawlState((prev) => {
        const newState = [...prev];
        newState[monthIndex] = { monthIndex, status: "loading" };
        return newState;
      });

      try {
        const res = await apiClient.post("/api/request",{
          year,
          month,
          Cookies,
          username,
        }, { responseType: 'blob' });
                
        const content = new Blob([res.data], { type: "application/pdf" });
        setFilesCrawlState((prev) => {
          const newState = [...prev];
          newState[monthIndex] = {
            monthIndex,
            status: "completed",
            content    
          };
 
          return newState;
        });

        console.log("Crawling month: " + year + " " + month + "\nSuccess!!!");
      } catch (err) {
        console.log(
          "Crawling month: " + year + " " + month + "\nError: " + err
        );

        setFilesCrawlState((prev) => {
          const newState = [...prev];
          newState[monthIndex] = { monthIndex, status: "error" };
          return newState;
        });

        // Stop crawling by returning a rejected promise
        return Promise.reject(err);
      }
    }
  },
    [Cookies, username]
  );

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev + 1);
  };

  useEffect(() => {
    const crawlAndHandleNext = async () => {
      if (stop) {
        return;
      }
      try {
        if (currentMonth === Mesi.length){
          setStop(true);
          return;
        }
        await crawl(currentMonth);
        handleNextMonth();
      } catch (err) {
        // Handle error here if needed
      }
    };

    crawlAndHandleNext();
  }, [crawl, currentMonth, stop]);

  const downloadAllFiles = () => {
    const zip = new JSZip();

    filesCrawlState.forEach((crawlState, index) => {
      if (crawlState.status === "completed" && crawlState.content) {
        const [year, month] = Mesi[index];

        // Convert Blob to ArrayBuffer synchronously
        // Create Blob object from ArrayBuffer
        const blob = crawlState.content;
        console.log(blob);
        // Add file to ZIP
        zip.file(`${year}-${month + 1}.pdf`, blob);
      }
    });

    // Generate ZIP file
    zip.generateAsync({ type: "blob" }).then((blob) => {
      console.log(blob);
      // Save ZIP file
      saveAs(blob, "crawled_files.zip");
    });
  };

  return (
    <>
      <div className="overflow-y-scroll h-40 mb-6">
        {Cookies && (
          <div>
            {filesCrawlState.map((status, index) => (
              <FileCrawler
                key={index}
                status={status}
                crawl={() => crawl(index)}
              />
            ))}
          </div>
        )}
      </div>
      <span className="text-md flex  items-center justify-start gap-6 ">
        {stop ? (
          <VscDebugStart className="h-8 w-8" onClick={() => setStop(false)} />
        ) : (
          <IoStopCircleOutline
            className="h-8 w-8"
            onClick={() => setStop(true)}
          />
        )}

        <SaveAllIcon onClick={downloadAllFiles} />
      </span>
    </>
  );
};

export default Crawler;
