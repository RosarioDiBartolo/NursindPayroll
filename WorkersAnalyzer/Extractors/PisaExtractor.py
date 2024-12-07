import re

from .PageExtractor import PageExtractor
mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
datetime_format = '%Y-%m-%d  %H:%M'  # Example format: 'days hours:minutes'



class PisaExtractor(PageExtractor):

    SingoliOrari = re.compile(r"\b\d\d:\d\d\b")
    PatternEntrateUscite = re.compile(r"(E|U)(\d\d:\d\d)")
    PatternData = re.compile(r'(Lun|Mar|Mer|Gio|Ven|Sab|Dom)\s(\d\d)')

    NamePattern = re.compile(r'[^a-zA-Z\s]')




    @staticmethod
    def extract_from_row(row):

        EntrateUscite = PisaExtractor.PatternEntrateUscite.findall(row)
        match = PisaExtractor.PatternData.search(row)
        if match:
            wday, day = match.group().split()
            day = int(day)
        else:
            return []

        if  len(PisaExtractor.SingoliOrari.findall(row)) > 4:
            return [("M", day, 0, 0, wday)]

        return [(tipo, day, int(orario[0:2]), int(orario[3:]), wday) for (tipo, orario) in
                EntrateUscite] if EntrateUscite else [(None, day, 0, 0, wday)]

    def content(self):

        for row in self.page[5:]:
            if row.startswith("TOTALI"):
                return  # Stop when the delimiter is encountered
            if not row:
                continue
            yield row

    def extract_name(self):
        return PisaExtractor.NamePattern.sub("", self.page[0]).replace("Matricola", "").strip().upper()
    def extract(self):
        interested = self.content()

        return [timbratura for row in interested for timbratura in PisaExtractor.extract_from_row(row)  if row]


if __name__ == '__main__':
    from ..EasyTest.PisaUtils import Page


    extractor = PisaExtractor( Page  )