import { range } from "@/lib/utils";
import { CheckCheckIcon } from "lucide-react";


const strMonths = [
  "GENNAIO" ,
  "FEBBRAIO" ,
  "MARZO" ,
  "APRILE" ,
  "MAGGIO" ,
  "GIUGNO"  ,
  "LUGLIO"  ,
  "AGOSTO"  ,
  "SETTEMBRE" ,
  "OTTOBRE"  ,
  "NOVEMBRE"  ,
  "DICEMBRE"  
]

export let Mesi: number[][] = [];
const currentDate = new Date();

// Get the current year
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();
// Get the current month (zero-based index, so January is 0, February is 1, etc.)
const start_month = 0;
const start_year = 2019;
for (let year = start_year; year <= currentYear; year++) {
  const Months =
    year === currentYear
      ? range(start_month, currentMonth )
      : range(start_month, 11);
  const Packed = Months.map((m) => [year, m]);

  Mesi = [...Mesi, ...Packed];
}
 export interface CrawlState {
  content?: Blob;
  monthIndex:number;
  status: "loading" | "completed" | "error";
} 


const FileCrawler = ({ status, crawl }: { status: CrawlState, crawl: () => void }) => {
  const { monthIndex, status: crawlStatus } = status;
  const [year, month] = Mesi[monthIndex];

  

  return (
    <div className={`flex gap-3 items-center overflow-y-hidden ${crawlStatus === "loading" ? "elipsis disappear" : ""}`}>
      {`Estrazione dati per ${year} ${strMonths[month]}`}
      {crawlStatus === "completed" && <CheckCheckIcon className="text-green-600"/>  }
      {crawlStatus === "error" && (
        <button onClick={crawl} className="text-red-700">✕</button>
      )}
    </div>
  );
};

export default FileCrawler;