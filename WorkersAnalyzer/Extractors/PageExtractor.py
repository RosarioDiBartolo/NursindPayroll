import abc
import datetime
import os
import re
from typing import List, Tuple, Generator

import pandas as pd

from ..ExctractingError import ExtractingError

w_days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']


PageColumns =  ["Tipo" ,"Data", "Orario lavorativo"]

def page_data( data ):
    return pd.DataFrame(data, columns=PageColumns).dropna( subset= ["Tipo", "Data"]  )

def parse_time(orario):
    return  int(orario[0:2]), int(orario[3:])

class PageExtractor  :
    mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre",
            "novembre", "dicembre"]


    MONTHS_YEAR_PATTERN = re.compile(
        r'(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s(\d\d\d\d)',
        re.IGNORECASE)
    def __init__(self, page):

        self.page = page

        self.mese, self.anno = self.search_month_year( )

        self.name = self.extract_name()

        self.data = page_data( self.extract() )

    @abc.abstractmethod
    def _extract_row (self ,row: str ) -> List[tuple[str, datetime, datetime.timedelta]] :
        pass


    @abc.abstractmethod
    def _get_content(self) -> Generator[str, None, None]:
        pass

    def extract(self) -> List[Tuple[str, datetime.datetime, datetime.timedelta]]:
        """Extract timbrature information from the page content."""
        try:
            return [
                timbratura for row in self._get_content()  for timbratura in self._extract_row(row)
            ]
        except Exception as e:
            raise ValueError(f"Error extracting data: {e}") from e
    @abc.abstractmethod
    def extract_name(self ):
        pass

    def save(self, path):
        if os.path.exists(path):
            if not os.path.isdir(path):
                raise Exception(f"Cant' save file here: {path}")
        else:
            os.makedirs(path)

        self.data.to_csv( os.path.join(path, f"{self.name}-{self.anno}-{self.mese}.csv") )
    def search_month_year( self):
        for row in self.page:
            match = PageExtractor.MONTHS_YEAR_PATTERN.search(row)
            if match:
                mese, anno = match.group().split()
                return PageExtractor.mesi.index(mese.lower()) + 1, int(anno)

        raise ExtractingError(self.page, "Mese")


def RowExtract(extractor: PageExtractor, tipo: str, giorno: int, ora: int, minuto: int, ora_orario_lavorativo: int = None, minuto_orario_lavorativo: int = None):
        tipo = tipo
        date = datetime.datetime(
            year=extractor.anno,
            month=extractor.mese,
            day=giorno,
            hour=ora,
            minute=minuto)


        orario_lavorativo = datetime.timedelta(hours=int(ora_orario_lavorativo), minutes=int(minuto_orario_lavorativo)) if (ora_orario_lavorativo and minuto_orario_lavorativo) else None

        return  (tipo, date, orario_lavorativo)