import React from "react";

function MyNavBar() {
  return (
    <nav className="w-full flex items-center p-3 shadow-md shadow-slate-300   overflow-x-auto justify-between">
      <div className="flex">
        <button  className=" hover:text-teal-500 active:bg-slate-100 rounded-xl p-3 transition-all active:scale-75" ><a  className = " font-normal" href="/buste-paga"> Estrazione buste paga.</a></button>
      </div>
    </nav>
  );
}

export default MyNavBar;
