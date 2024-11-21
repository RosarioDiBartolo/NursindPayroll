import React
//, { createContext, useState } 
from "react";

interface MapProps<T> {
  Arr: Array<T>;
  Comp: React.FC<T>;
}

const Map = <T,>({ Arr, Comp }: MapProps<T>) => {
  return (
    <>
      {Arr.map((props, index) => (
        <Comp key={index} {...props} />
      ))}
    </>
  );
};
 

export default Map;