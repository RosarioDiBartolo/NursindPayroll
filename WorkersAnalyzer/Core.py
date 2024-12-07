import os
#from tkinter import filedialog

import PyPDF2
import numpy as np
from PyPDF2 import PdfReader


Orari_Entrate = np.array([7, 14, 21])

Orario_turno = {
7: "Mattina",
14: "Pomeriggio",
21: "Notte",
}
def turno(entrata):
    indice_piu_vicino = np.argmin(np.abs(Orari_Entrate - entrata.hour))
    numero_piu_vicino = Orari_Entrate[indice_piu_vicino]
    return Orario_turno[numero_piu_vicino]
class Directory:

    def __init__(self, dir):
        if not os.path.exists(dir):
            os.makedirs(dir)

        self.directory = dir
    def __repr__(self):
        return f"path: {self.directory}"
    def to(self, file):
        return os.path.join(self.directory, file)

    @staticmethod
    def return_dir(method):
        def wrapper(*args, **kwargs):
            directory = method(*args, **kwargs)
            return Directory(directory)

        return wrapper
    @return_dir
    def path(self, *paths) :
        return os.path.join(self.directory, *paths)



    """@staticmethod
    def from_explorer():
        dir = filedialog.askdirectory(initialdir="./",
                                            title="Select a Directory",)
        return Directory(dir)"""

def basename(file):
    return file.split('.')[0]

def PDFIterator(file):
    pages = PyPDF2.PdfReader(file).pages

    for page in pages:
        text = page.extract_text()
        if not text:
            continue

        yield text.split("\n")

script = Directory(os.path.dirname(os.path.abspath(__file__)))
tests = script.path("./Tests")
def test_sample(Azienda ):
    DirectoryEsempi: Directory = tests.path( Azienda )


    RawTextPath = os.path.join(DirectoryEsempi.directory, "RawText")
    if not os.path.exists(RawTextPath):
        PDFS = DirectoryEsempi.path("PDFS")

        files = os.listdir( PDFS.directory )

        sample = files[0]
        print(sample)
        path = PDFS.to(sample)
        print( path )
        content = "\nPAGE\n".join(  list(map( lambda p: p.extract_text(),  PdfReader( path ).pages  )) )
        RawText = Directory(RawTextPath)

        with open(RawText.to( f"{basename(files[0])}.text"), "w") as cache:
            cache.write(content)
    else:
        RawText = Directory(RawTextPath)
        files = os.listdir( RawTextPath )
        sample = f"{basename(files[0]) }.text"
        with open( RawText.to(sample), "r") as inp:
            content = inp.read()

    Pages = content.split("\nPAGE\n")
    return [ p.split("\n") for p in Pages ]