// Import necessary libraries
import FileUploader, { useFiles } from "../components/Widgets/FileUploader";
import  Block from "../components/Widgets/Block";
 

// Main TasksPage component
function Tasks() {
    
  const [files, setFiles] = useFiles()

  console.log(files)
  return (
    <div className="flex flex-col  ">
      {files.length  > 0 ? (
        files.map((block, idx) => <Block key={idx} Block={block} />)
      ) : (
        <h3 className="text-slate-600 rounded-sm  text-opacity-90 ">
          Comincia l'analisi dei pdf di dipendenti di diverse aziende
          nell'ambito sanitario: <code>Azienda Pisa, Policlinico e Marche</code>
        </h3>
      )}
      <footer className="flex  w-[100%] my-6 ">
        <FileUploader multiple className=" bg-green-300 transition-all hover:bg-green-500 active:bg-green-100 active:text-green-500 px-3 py-2 text-white" setFiles={setFiles}
         >
          Aggiungi analisi...
        </FileUploader>
      </footer>

     </div>
  );
}

export default Tasks;
