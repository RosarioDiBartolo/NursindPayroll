import abc
import os
import re

from ..ExctractingError import ExtractingError
from  .PageData import  PageData
w_days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']



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

    def read(self):
        data = PageData(data=self.extract(), nome=self.extract_name(), mese=self.mese, anno=self.anno)
        return data
    @abc.abstractmethod
    def extract (self ):
        pass
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