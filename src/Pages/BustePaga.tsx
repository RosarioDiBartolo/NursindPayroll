import   { useRef, useState } from "react";
import Navbar from "@/components/Widgets/Navbar";
import { CheckCheckIcon } from "lucide-react";
import { conditional_class } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { RequestsEndpoint } from "@/components/Widgets/FileCrawler";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Crawler from "@/components/Widgets/Crawler";
import { BustePagaContext } from "./Context";
interface AuthState{
  type: "loading" | "success" | "error" | "undefined"
  data?: object;
}
const LoginEndpoint = RequestsEndpoint.path("/login");


function BustePaga() {
    
  const usernameRef = useRef<HTMLInputElement>( null );
  const passwordRef = useRef<HTMLInputElement>( null );
  const [Cookies, setCookies] = useState<object>(  )
  const [UserStatus, setUserStatus] = useState<AuthState>({ type: "undefined" })
  return (
    <BustePagaContext.Provider value={{Cookies, username: usernameRef.current?.value}}>
       
    <div className="w-full h-full flex ">
      <div
          className={conditional_class(
          "min-w-80  h-full border-solid border-spacing-1 shadow-lg border border-gray-400 rounded-sm p-8 bg-gradient-to-b flex flex-col gap-3",
          UserStatus.type != "error",
          "from-slate-200",
          "from-red-200"
        )} 
      >
        <Label className="text-sm">Username...</Label>
        <Input name = "username" ref = {usernameRef} />
        
        <Label className="text-sm">Password...</Label>
        <Input name = "password" type = "password" ref = {passwordRef} />

        <Button  className="flex items-center gap-2 m-3 my-6 hover:bg-slate-500 hover:text-slate-900  " onClick={()=>{
            LoginEndpoint.post(
              {
                username: usernameRef.current?.value,
                password: passwordRef.current?.value
              },
              {
                
              headers: {
  
              },
               }, 
            ).then(
              (res )=>{
                setCookies(
                  res.data
                )
                setUserStatus(
                  {type: "success"}
                )
              }
            ).catch((err) => {
              setUserStatus({type: "error", data: err })
            })

            setUserStatus({
              type: "loading"
            })
        }}>  Login</Button>
      </div>
      <div className="flex-1 flex flex-col h-full">
        <Navbar />
        <div className="p-10 flex-1 bg-slate-200">
          <h1 className="font-semibold text-xl"> Stato operazione</h1>
          <div className="text-sm opacity-65">
          <span className="  flex gap-3 items-center  ">
            {UserStatus.type == "success" ? ( <>Login effettuato con successo
            <CheckCheckIcon className="text-green-600" /></> ): 
              (UserStatus.type == "loading"? (
                <LoadingSpinner/> 
              ):(<>
              
              Errore durante l {"'"} autenticazione... 
              </> 
              )
              
              )
              
              } 
              
          </span>

          {UserStatus.type == "success"? (
            <Crawler   />
          ): null}</div>

          
         </div>
      </div>
    </div>
    
    </BustePagaContext.Provider>
  );
}

export default BustePaga;
