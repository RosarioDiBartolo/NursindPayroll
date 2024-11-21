import { ReactNode } from "react";

 
export interface ChildrenProps{
  children:  ReactNode;
}

export type ForwardChildren = (props: ChildrenProps)=> ReactNode;


export const IconText: ForwardChildren = ({children})=>(
  <span className="flex gap-3">
  {children}
  </span>
)


