
import Sidebar from "@/components/Widgets/Sidebar";
import { Outlet } from "react-router-dom";
 
import MyNavBar from "@/components/Widgets/MyNavBar";

export default function Layout() {
  return (
    <div className='h-screen flex flex-col '>
    
    <header className=" sticky top-0 z-20 bg-white"> <MyNavBar/></header>
    <div className="flex flex-1">
      <Sidebar />
  
      <div className="flex-1">
      <h1 className="m-6 text-lg ">
        <strong className={ "elipsis disappear"}>Operazioni in corso</strong> 
      </h1>
      <div className="w-full p-6 ">
      <Outlet />

      </div>
       </div>
       
    </div>
    
    </div >
  );
}
