import re

from ..ExctractingError import ExtractingError
from .PageExtractor import PageExtractor, w_days
class MarcheExtractor(PageExtractor):
    Azienda = "Marche"

    GiorniSettimana = ["LU", "MA", "ME", "GI", "VE", "SA", "DO"]
    WeekTable = dict(zip(GiorniSettimana  ,  w_days))
    contentEndPattern = "Assenze Fruito del mese CompetenzeFruito Totale Residuo"
    PatternEntrateUscite = re.compile(r"(E|U)(\d\d:\d\d)")
    PatternData = re.compile(r'(\d\d)\s(LU|MA|ME|GI|VE|SA|DO)')
    DatePattern = re.compile(r'\d{2}/\d{4}')
    NamePattern = re.compile(r"(\w+)\sCognome\s([\w\s]+)\sNome")

    @staticmethod
    def extract_from_row(row):
        EntrateUscite = MarcheExtractor.PatternEntrateUscite.findall(row)
        match = MarcheExtractor.PatternData.search(row)
        if match:
            day, wday = match.group().split()
            day = int(day)
        else:
            return []

        return [(tipo, day, int(orario[0:2]), int(orario[3:]), wday) for (tipo, orario) in
                EntrateUscite] if EntrateUscite else [(None, day, 0, 0, wday)]

    def extract_name(self):
        # The assumption is that the name is in the format "SURNAME Cognome FIRSTNAME Nome"
        # Extracting surname and first name from the first two rows of the page
        # Construct a string that combines relevant parts of the first two rows
            text = f"{self.page[0]} {self.page[1]}"

            # Use the regular expression to match the name format
            match = MarcheExtractor.NamePattern.search(text)

            if match:
                # If a match is found, return the extracted name in the desired format
                surname = match.group(1)
                firstname = match.group(2)
                return f"{surname}, {firstname}"
            else:
                raise ExtractingError(f"Name extraction failed on text: {text}", "name")

    def content(self):

        for row in self.page[13:]:
            if MarcheExtractor.contentEndPattern in row:
                return  # Stop when the delimiter is encountered
            if not row:
                continue
            yield row

    def read(self):
        pageData = super(MarcheExtractor, self).read()
        print(pageData)
        pageData.data["Settimana"] = pageData.data["Settimana"].apply(lambda x :  MarcheExtractor.WeekTable[x])
        return pageData

    def extract(self):
        interested = self.content()

        return [timbratura for row in interested for timbratura in MarcheExtractor.extract_from_row(row)  if row]
    def search_month_year(self):
        row: list[str] = self.page[1].split()


        month, year = PageExtractor.mesi.index( row[-2].lower() )  + 1, int(row[-1])
        return month  , year


if __name__ == '__main__':
    from ..Core import test_sample

    Pages = test_sample("Marche")

    Extractor = MarcheExtractor(Pages[0] )

