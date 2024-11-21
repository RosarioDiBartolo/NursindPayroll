import React from "react";

const NavField = () => (
  <span className="p-3  rounded-sm  font-semibold overflow-none text-nowrap text-ellipsis">
    Funzionalità principali
  </span>
);

function MyNavBar() {
  return (
    <nav className="w-full flex items-center p-3 shadow-md shadow-slate-300   overflow-x-auto justify-between">
      <span className="flex  gap-3 ">
        <NavField />
        <NavField />
        <NavField />
      </span>
      <span className="flex  gap-3 ">
        <NavField />
        <NavField />
      </span>

      <div className="flex"> </div>
    </nav>
  );
}

export default MyNavBar;
