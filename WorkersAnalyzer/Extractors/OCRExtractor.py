

from ..Core import  turno


class OCRExtractor:
    def __init__(self ,  ):
        pass
    #list of pandas Dataframes for different Pages of the same PDF
    def features(self, block ):
        data = [  self.parse_from_corpus(corpus) for corpus in block]
        return data

    

    def parse_from_corpus(self, corpus ):

        data , name =  self.extract_from_text_corpus(corpus)
        if "orario" not in data.columns:
            data = data.dropna( subset = ['entrata'] )
            data["orario"] = data["entrata"].apply(turno)
        else:
            if 'entrata' not in data.columns:
                data = data.dropna( subset = ['orario'] )
                data['entrata'] =  data["orario"].apply( OCRExtractor.orario_to_entry  )

        data["turno"] = data["entrata"].apply(turno)

        return data, name

    def extract_from_text_corpus(self, corpus):
        # Return a pandas dataframe with the required columns: "Entrata" + some optional/additional columns: "Orario" "Giorno" "Giorno della settimana"
        pass

    @staticmethod
    def isEntry(word):
        if not word:
            return

        # returns the value of the entry independently if its in HHMM format or HH:MM format, the only condition is that it starts with an "E" or an "e".
        # if the word is not an entry (it doesn't start with "E" or "e"), it will return None, else it will return the value of the entry
        Firstletter = word[0]
        if Firstletter.upper() == "E":
            entry = word[1:]
            return entry
    @staticmethod
    def orario_to_entry(orario ):
        try:
            return int(orario.replace(':', ''))
        except ValueError as err:
            print("Abbiamo riscontrato un errore nella gestione del seguente orario:", orario, '\ncontrollare che l\'orario in questione sia nel corretto formato:  "HH:MM"')

            raise err