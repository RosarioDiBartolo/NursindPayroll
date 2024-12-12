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
    return  Orario_turno[numero_piu_vicino]

def PDFIterator(file):
    pages = PyPDF2.PdfReader(file).pages

    for page in pages:
        text = page.extract_text()
        if not text:
            continue

        yield text.split("\n")

def differenziale(df: pd.DataFrame):
    required_columns = {"Tipo", "Orari lavorativi", "Data"}
    if not required_columns.issubset(df.columns):
        raise ValueError(f"Il DataFrame deve contenere le colonne: {required_columns}")

    if not pd.api.types.is_datetime64_any_dtype(df["Data"]):
        df["Data"] = pd.to_datetime(df["Data"])

    if len(df) > 0:
        if df["Tipo"].iloc[0] == "U":
            df = df.drop(index=0).reset_index(drop=True)
        if df["Tipo"].iloc[-1] == "E":
            df = df.drop(index=df.index[-1]).reset_index(drop=True)

    index = df.index // 2

    grouped = pd.DataFrame({
        'Orari lavorativi': df["Orari lavorativi"].groupby(index).sum().reset_index(drop=True),
        'Data entrata': df[df["Tipo"] == "E"]['Data'].reset_index(drop=True),
        'Data uscita': df[df["Tipo"] == "U"]['Data'].reset_index(drop=True)
    })

    grouped["Data ideale entrata"] = grouped["Data entrata"].dt.round('h')
    grouped["Data ideale uscita"] = grouped["Data ideale entrata"] + pd.to_timedelta(grouped["Orari lavorativi"], unit='h')
    grouped["Differenza uscita"] = grouped["Data uscita"] - grouped["Data ideale uscita"]

    grouped["Differenza entrata"] = grouped["Data ideale entrata"] - grouped["Data entrata"]

    MinutiDifferenzeUscita = grouped["Differenza uscita"].dt.total_seconds() / 60
    MinutiDifferenzeEntrata = grouped["Differenza entrata"].dt.total_seconds() / 60

    MinutiTagliatiUscita = np.maximum(np.minimum(MinutiDifferenzeUscita, 5), 0)

    MinutiTagliatiEntrata = np.maximum(np.minimum(MinutiDifferenzeEntrata, 5), 0)

    return    MinutiTagliatiEntrata, MinutiTagliatiUscita