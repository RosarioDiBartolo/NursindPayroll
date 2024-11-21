
import {  signInWithEmailAndPassword    } from 'firebase/auth';
import {   useNavigate } from "react-router-dom";
import {auth} from '../config'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRef  } from 'react';
 
import { useAuthState } from 'react-firebase-hooks/auth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export function Login() {
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate();

  const login = async ()=>{
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;
    
    signInWithEmailAndPassword(auth, email || "", password || "")
    navigate("/")
  }

  const [user, loading, error] = useAuthState(auth);
  loading;
  if (user){
    navigate("/")

  }

  return (
    <div className='h-screen flex justify-center items-center '>
      {loading ? <LoadingSpinner /> : (<Card className="w-[350px]   ">
      <CardHeader>
        <CardTitle>Accedi al tuo Account</CardTitle>
        <CardDescription> { error ? "Credenziali invalide"  : "Immetti le tue credenziali per aver accesso alla piattaforma."  }</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email:</Label>
              <Input ref={emailRef} id="email" placeholder="La tua Email" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password:</Label>
              <Input ref={passwordRef} type="password" id="password" placeholder="password del tuo account" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="Tipo Utente">Tipo Utente:</Label>
              <Select defaultValue="Admin">
                <SelectTrigger id="Tipo Utente">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Contributore">Contributore</SelectItem>
                  <SelectItem value="Esterno">Esterno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={login}>Accedi</Button>
      </CardFooter>
    </Card>) }
     
    
    </div>
  )
}

export default Login;