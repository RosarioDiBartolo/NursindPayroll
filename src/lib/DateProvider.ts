import { createContext, useContext   } from "react";
import { DateRange } from "react-day-picker";
import { SelectRangeEventHandler } from "react-day-picker"

export const DateContext = createContext<[DateRange,   SelectRangeEventHandler ]>([{ from: new Date() }, () => {}]);

export const useSelectedDate = () => useContext(DateContext);
