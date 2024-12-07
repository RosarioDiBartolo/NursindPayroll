
datetime_format = '%Y-%m-%d  %H:%M'  # Example format: 'days hours:minutes'

import pandas as pd


WeekDays = ["lu", "ma", "me", "gi", "ve", "sa", "do"]


PageColumns =  ["Tipo", "Giorno", "Ore", "Minuti", "Settimana"]
class PageData:


    def __init__(self, anno, mese, nome, data):
        self.anno = anno
        self.mese = mese
        self.nome = nome
        self.data =  pd.DataFrame(data, columns=PageColumns).dropna(   )

    def encode_date(self):
        datetime_string = str(self.anno) + "-" + str(self.mese) + "-" + self.data["Giorno"].astype(
            str) + " " + self.data["Ore"].astype(str) + ":" + self.data["Minuti"].astype(str)
        return pd.to_datetime(datetime_string, format=datetime_format)

    def with_datetime(self):
        return  self.data.assign( Data = self.encode_date()).drop( columns=["Giorno", "Ore", "Minuti"], axis=1)