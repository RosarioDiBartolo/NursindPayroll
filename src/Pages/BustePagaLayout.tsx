import { Outlet } from "react-router-dom";

function BustePagaLayout() {
  return (
    <div className='w-screen h-screen flex p-16 bg-slate-400'>{<Outlet />}</div>
  )
}

export default BustePagaLayout