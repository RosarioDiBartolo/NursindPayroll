import CauseProcess from '@/components/Widgets/CauseProcess';
import FileUploader, { useFiles } from '@/components/Widgets/FileUploader'
import { IoIosCloudUpload  } from "react-icons/io";

 
function Cause() {
    const [files, setFiles] = useFiles()
    console.log(files)
    return (
    <>
    <FileUploader setFiles={setFiles} multiple className='flex items-center gap-3 font-bold text-gray-700'>
    <IoIosCloudUpload size={30} className=' animate-bounce' /> { (files.length == 0 ) && <span className=''>  Selezioana le cause... </span> }
    </FileUploader>
    <div className=' flex flex-col gap-3'>
         
    {
        files.map((f)=>(
            <CauseProcess file={f} />
        ))
    }
    
    </div>
    </>
)
}

export default Cause