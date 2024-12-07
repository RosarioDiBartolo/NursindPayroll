import { UserCircle } from "lucide-react";
import { IoSettingsOutline, IoSettingsSharp } from "react-icons/io5";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "../ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/config";
import { useState } from "react";
import { cn } from "@/lib/utils";
import "./Sidebar.css";

function UserAccordion() {
  return (
    <AccordionItem value="User">
      <AccordionTrigger  >
        <button className="flex items-center gap-2">
          <UserCircle className="no-rot" />
          <span className="conditional-text transition-all duration-300">
            Utente
          </span>
        </button>
      </AccordionTrigger>
      <AccordionContent className="bg-slate-100 rounded-md p-4">
        <Button
          onClick={() => signOut(auth)}
          variant="link"
          className="hover:text-red-700 deco"
        >
          Logout
        </Button>
        <div className="mt-2 text-sm text-gray-700">Utente: Is it accessible?</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function Sidebar() {
  const [expand, setExpand] = useState<boolean>(false);

  const triggerExpand = () => {
    setExpand((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "border bg-white p-3 shadow-md shadow-slate-600 conditional transition-all duration-300 ease-in-out",
        !expand && "close"
      )}
    >
      <h1
        className="text-2xl h-[24px] font-bold flex items-center gap-3 cursor-pointer"
        onClick={triggerExpand}
      >
        <span
          className={cn(
            "transition-all duration-500 ease-in-out",
            expand && "rotate-45"
          )}
        >
          {expand ? <IoSettingsSharp /> : <IoSettingsOutline />}
        </span>
        <span>Impostazioni</span>
      </h1>

      <div className="mt-4">
        <Accordion type="single" collapsible>
          <UserAccordion />
        </Accordion>
      </div>
    </div>
  );
}

export default Sidebar;