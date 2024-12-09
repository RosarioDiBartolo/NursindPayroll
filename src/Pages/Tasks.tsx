// Import necessary libraries
import TasksProvider from "@/lib/tasks/tasks-provider";
import Block from "../components/widgets/blocks/block";
import { useState } from "react";
import { AiFillDelete } from "react-icons/ai";

interface BlockProps {
  id: number;
}
// Main TasksPage component
function Tasks() {
  const [blocks, setBlocks] = useState<BlockProps[]>([]);

  return (
    <TasksProvider>
      <div className="flex flex-col  gap-5  ">
        {blocks ? (
          blocks.map((n) => (
           < div className="  overflow-hidden border bg-white  hover:border-slate-700 shadow-xl relative">              {" "}
              <div className=" flex justify-between  items-center  text-white bg-slate-900 text-3xl font-bold p-3">
                {" "}
                <div className=" ">
                  Blocco Analisi:{" "}
                  <input
                    className=" px-3 text-green-500 bg-transparent"
                    type="text"
                  />{" "}
                </div>{" "}
                <button onClick={()=>{
                  setBlocks( prev => prev.filter( b => b.id !== n.id ) )
                }} className=" group aspect-square bg-slate-800 p-1">
                  <AiFillDelete className=" group-hover:fill-red-500" />
                </button>{" "}
              </div>
              <Block key={n.id} />
            </div>
          ))
        ) : (
          <h3 className="text-slate-600 rounded-sm  text-opacity-90 ">
            Comincia l'analisi dei pdf di dipendenti di diverse aziende
            nell'ambito sanitario:{" "}
            <code>Azienda Pisa, Policlinico e Marche</code>
          </h3>
        )}
        <footer className="flex  w-[100%] my-6 ">
          <button
            onClick={() => {
              setBlocks((prev) => [...prev, { id: prev.length }]);
            }}
            className="relative hover:text-white inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
              Aggiungi blocco analisi...
            </span>
          </button>
        </footer>
      </div>
    </TasksProvider>
  );
}

export default Tasks;
