import React, {   useRef, useState } from 'react';
 

interface Props{
    children: React.ReactNode; 
    className?: string;
    multiple?: boolean;
    setFiles: React.Dispatch<React.SetStateAction<File[]>>
}
export const useFiles = ()=>{  
  return  useState<File[]>([])
 }

const FileUploader = (  { children, setFiles, className, multiple = false } : Props ) => {
  
  const InputRef = useRef<HTMLInputElement>(null)
  console.log( InputRef.current?.files)
  return (
    <> 
      <button onClick={()=> InputRef.current?.click()} className={className}  >{children}</button>
      <input
      multiple = { multiple}
      onChange={(e)=>{
        setFiles( Array.from( e.target.files || [] )   )
      }}
        type="file"
        accept=".pdf"
        ref={InputRef}
        style={{ display: 'none' }}
        />
      </>
  );
}
 
export default FileUploader;