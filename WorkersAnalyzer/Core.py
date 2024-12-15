import datetime

import PyPDF2
import numpy as np
import pandas as pd

Orari_Entrate = np.array([7, 14, 21])

Orario_turno = {
    7: "Mattina",
    14: "Pomeriggio",
    21: "Notte",
}


def turno(hour):
    indice_piu_vicino = np.argmin(np.abs(Orari_Entrate - hour))
    numero_piu_vicino = Orari_Entrate[indice_piu_vicino]
    return Orario_turno[numero_piu_vicino]


def PDFIterator(file):
    pages = PyPDF2.PdfReader(file).pages

    for page in pages:
        text = page.extract_text()
        if not text:
            continue

        yield text.split("\n")

