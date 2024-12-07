import re

from ..ExctractingError import ExtractingError
from .PageExtractor import PageExtractor, w_days
class GaribaldiExtractor(PageExtractor):
    Azienda = "Garibaldi"
    contentEndPattern = re.compile(r"\b\d+:\d+\b")
    GiorniSettimana = ["LU", "MA", "ME", "GI", "VE", "SA", "DO"]
    WeekTable = dict(zip(GiorniSettimana  ,  w_days))

    PatternEntrateUscite = re.compile(r"(E|U)(\d\d:\d\d)")
    PatternData = re.compile(r'(\d\d)\s(LU|MA|ME|GI|VE|SA|DO)')
    DatePattern = re.compile(r'\d{2}/\d{4}')

    @staticmethod
    def extract_from_row(row):
        EntrateUscite = GaribaldiExtractor.PatternEntrateUscite.findall(row)
        match = GaribaldiExtractor.PatternData.search(row)
        if match:
            day, wday = match.group().split()
            day = int(day)
        else:
            return []

        return [(tipo, day, int(orario[0:2]), int(orario[3:]), wday) for (tipo, orario) in
                EntrateUscite] if EntrateUscite else [(None, day, 0, 0, wday)]
    def extract_name(self):
        return f"{self.page[0].split()[0]} {self.page[1].split()[0]}"
    def content(self):

        for row in self.page[13:]:
            if GaribaldiExtractor.contentEndPattern.match(row):
                return  # Stop when the delimiter is encountered
            if not row:
                continue
            yield row

    def read(self):
        data = super(GaribaldiExtractor, self).read()
        data.raw["Settimana"] = data.raw["Settimana"].apply(lambda x :  GaribaldiExtractor.WeekTable[x])
        return data

    def extract(self):
        interested = self.content()

        return [timbratura for row in interested for timbratura in GaribaldiExtractor.extract_from_row(row)  if row]
    def search_month_year(self):
        row = self.page[4]
        Match = GaribaldiExtractor.DatePattern.search(row)
        if not Match:
            raise ExtractingError(self.page, "Data")
        month, year = Match.group().split("/")
        return int(month), int(year)


if __name__ == '__main__':
    from ..Core import test_sample

    Pages = test_sample("Garibaldi")

    Extractor = GaribaldiExtractor(Pages[0].splitlines())
