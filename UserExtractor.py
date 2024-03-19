import datetime

import pandas as pd

from WorkersAnalyzer.Core import PDFIterator, turno, Directory
from WorkersAnalyzer.Extractors.DataExtracted import DataExtracted
from WorkersAnalyzer.PisaExtractor import PisaExtractor




class UserExtractor:
    def __init__(self, Extractors):

        self.data ,  self.name  = UserExtractor.extract_from_extractors(Extractors)

    def elaborate(extractor):

        Elaboration = pd.DataFrame( {"Anno":   extractor.data.raw["Data"].apply(lambda date: date.year ).tolist()  , "Turno" : extractor.data.turni().tolist() } )

        return Elaboration.groupby("Anno" )


    @staticmethod
    def from_block(block):
        return UserExtractor(  [ PisaExtractor(page) for page in block  ] )

    @staticmethod
    def from_files(files):
        pages = [page for file in files for page in PDFIterator(file)]
        return UserExtractor(   PisaExtractor(page) for page in pages   )


    @staticmethod
    def extract_from_extractors( Extractors: list[PisaExtractor] ):

        names = {e.name for e in Extractors}
        if len(names)> 1:
            pass
            #raise Exception("Nomi diversi all'interno delle pagine...")

        df = pd.concat( e.read().with_datetime().raw for e in Extractors ).dropna()



        df.drop(df[df["Tipo"] == "M"].index)

        df["Boolean-Type"] = df["Tipo"] == "E"

        df.sort_values(by='Data', ascending=True, inplace=True)

        iter = df.iterrows()
        Entrate = []
        Uscite = []
        for i, row in iter:
            if not row["Boolean-Type"]:
                continue

            for i, newRow in iter:

                if not newRow["Boolean-Type"]:
                    Entrate.append(row )
                    Uscite.append(newRow)
                    break
                else:
                    row = newRow

        Entrate = pd.DataFrame(Entrate).reset_index(drop=True)
        Uscite = pd.DataFrame(Uscite).reset_index(drop=True)

        filtered = Entrate[ (  Uscite["Data"] - Entrate["Data"]  ) > datetime.timedelta(hours = 6) ]


        return DataExtracted(  filtered ), list(names)[0]



if __name__ == '__main__':
     from WorkersAnalyzer.EasyTest.PisaUtils import Pages

     extractor = UserExtractor([PisaExtractor(p) for p in Pages ])



        

        


