import React from 'react'
import { IoIosCloudDownload } from 'react-icons/io'

function CauseProcess({ file}: { file: File}) {
  return (
    
    <div className=' flex w-full max-w-xl justify-between'><span>{file.name}</span> <IoIosCloudDownload size={18} /></div>
  )
}

export default CauseProcess