import pandas as pd

from .OCRExtractor import OCRExtractor


class CannizzaroExtractor(OCRExtractor):
    def extract_from_text_corpus(self, corpus):
        rows = corpus.split("\n")
        entries_column = rows[12]
        orari = [entries_column[i: i + 4] for i in range(0, len(entries_column), 4)]
        data = pd.DataFrame({"orario": orari}).dropna()
        return data
