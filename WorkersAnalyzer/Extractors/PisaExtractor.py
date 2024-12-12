import re
from datetime import time, datetime, timedelta
from typing import Generator, List, Tuple

from .PageExtractor import PageExtractor, RowExtract

mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre",
        "novembre", "dicembre"]
datetime_format = '%Y-%m-%d  %H:%M'  # Example format: 'days hours:minutes'


class PisaExtractor(PageExtractor):
    SingoliOrari = re.compile(r"\b\d\d:\d\d\b")
    PatternEntrateUscite = re.compile(r"(E|U)(\d\d:\d\d)")
    PatternData = re.compile(r'(Lun|Mar|Mer|Gio|Ven|Sab|Dom)\s(\d\d)')

    NamePattern = re.compile(r'[^a-zA-Z\s]')

    def _extract_row (self ,row: str ) -> List[tuple[str, datetime, timedelta]] :

        EntrateUscite = PisaExtractor.PatternEntrateUscite.findall(row)
        match = PisaExtractor.PatternData.search(row)
        if match and EntrateUscite:
            giorno = int(match.group().split()[1])

        else:
            return  []

        if len(PisaExtractor.SingoliOrari.findall(row)) > 4:
            return [RowExtract(self, tipo="M",  giorno=giorno,  ora= 0, minuto= 0)]

        return [    RowExtract(extractor=self, tipo=tipo, giorno=giorno, ora= int(orario[:2]), minuto=int(orario[3:]))
                for tipo, orario in EntrateUscite   ]

    def _get_content(self) -> Generator[str, None, None]:

        for row in self.page[5:]:
            if row.startswith("TOTALI"):
                return  # Stop when the delimiter is encountered
            if not row:
                continue
            yield row

    def extract_name(self):
        return PisaExtractor.NamePattern.sub("", self.page[0]).replace("Matricola", "").strip().upper()

