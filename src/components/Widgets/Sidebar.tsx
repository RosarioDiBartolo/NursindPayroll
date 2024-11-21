import { UserCircle } from "lucide-react";
import { IoSettingsOutline } from "react-icons/io5";
import { IoSettingsSharp } from "react-icons/io5";
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
import { conditional_class } from "@/lib/utils";
import { ForwardChildren, IconText } from "@/lib/ReactUtils";
import "./Sidebar.css";

const ConditionalText: ForwardChildren = ({ children }) => (
  <span className="conditional-text transition-all duration-300">{children}</span>
);

function UserAccordition() {
  return (
    <AccordionItem value="User">
      <AccordionTrigger>
         <IconText>
           <UserCircle className="no-rot" />{" "}
          <ConditionalText>Utente</ConditionalText>{" "}
        </IconText>{" "}
      </AccordionTrigger>
      <AccordionContent className="bg-slate-100 rounded-md  ">
        <Button
          onClick={() => signOut(auth)}
          variant="link"
          className="hover:text-red-700 deco"
        >
          Logout
        </Button>{" "}
        <div className="p-4">Utente Is it accessible?</div> 

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
      className={conditional_class(
        "border bg-white p-3 text-start shadow-md shadow-slate-600 conditional  transition-all  duration-300 ease-in-out",
        expand,
        "",
        "close"
      )}
    >
      <h1
        className="text-2xl h-[24px] font-bold flex items-center gap-3"
        onClick={triggerExpand}
      >
        <span className= {conditional_class("transition-all duration-1000 ease-in-out",expand, "rotate-45" )} >

         {expand ? <IoSettingsSharp   /> : <IoSettingsOutline />}
         </span>

        <ConditionalText>
        Impostazioni

        </ConditionalText>
       </h1>

 
      <div>
        <Accordion type="single" collapsible>
          <UserAccordition /> 
        </Accordion>
      </div>
    </div>
  );
}

export default Sidebar;
