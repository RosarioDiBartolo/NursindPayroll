import datetime
import traceback

import numpy as np
import pandas as pd
from flask import Flask, jsonify, send_file,   request, Response
from flask_cors import cross_origin, CORS
import requests
import io

from WorkersAnalyzer.BPC.crawler import crawl, mesi, login
from WorkersAnalyzer.Core import PDFIterator, turno
from WorkersAnalyzer.Extractors.PoliclinicoExtractor import PoliclinicoExtractor
from WorkersAnalyzer.Extractors.PisaExtractor import PisaExtractor
from WorkersAnalyzer.Extractors.GaribaldiExtractor import GaribaldiExtractor
from WorkersAnalyzer.Extractors.MarcheExtractor import MarcheExtractor
from WorkersAnalyzer.Extractors.PageExtractor import PageExtractor, w_days
from config import app, port

app = Flask(__name__)
CORS(app)
# Routes
@app.route("/")
def index():
    return "Server running"

# Session Storage
CrawlingSessions = dict()

# Login route
@app.route('/api/request/login', methods=['POST'])
@cross_origin()
def login():
    body = request.get_json()
    username, password = body.get("username", None), body.get("password", None)
    if username and password:
        session = login(username, password)
        cookies = requests.utils.dict_from_cookiejar(session.cookies)
        return jsonify(cookies), 200
    return jsonify({'message': 'Missing username or password'}), 400

@app.route('/api/request', methods=['POST'])
@cross_origin()
def request_bustapaga():
    try:
        body = request.get_json()
        session = requests.session()
        session.cookies.update(body["Cookies"])

        year, month, username = body.get('year'), body.get('month'), body.get('username')

        fileRequest = crawl(session, year, mesi[month], username)

        return send_file(
            io.BytesIO(fileRequest.content),
            as_attachment=True,
            download_name=f"{username}-{year}-{month}.pdf",
            mimetype="application/pdf"
        )
    except KeyError as err:
        return jsonify({'error': f"Missing required param: {err}"})
    except Exception as e:
        print(f"Error during request: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

# Error handler
@app.errorhandler(500)
def internal_error(exception):
    print(exception)
    print("500 error caught")
    print(traceback.format_exc())

# Extractor Table
extractorsTable = {
    "Pisa": PisaExtractor,
    "Policlinico": PoliclinicoExtractor,
    "Garibaldi":  GaribaldiExtractor,
    "Marche": MarcheExtractor
}

@app.route("/api/aziende", methods= ["GET"])
@cross_origin()
def Aziende():
    return jsonify(list(extractorsTable.keys())), 200
# Process year function


def merge(extractors: list[PageExtractor]):
    names = {e.name for e in extractors}
    #ALl extractors must have the same name, or the pages are incoherent
    if len(names) > 1:
        raise Exception("Nomi diversi all'interno delle pagine...")
    nome = names.pop()
    pages = pd.concat([ e.data for e in extractors])

    pages.drop(pages[pages["Tipo"] == "M"].index)

    pages.sort_values(by='Data', ascending=True, inplace=True)


    if len(pages) > 0:
        if pages["Tipo"].iloc[0] == "U":
            pages = pages.drop(index=0).reset_index(drop=True)
        if pages["Tipo"].iloc[-1] == "E":
            pages = pages.drop(index=pages.index[-1]).reset_index(drop=True)


    merged = pd.DataFrame()
    Entrate = pages[pages["Tipo"] == "E"].reset_index(drop=True)

    Uscite = pages[pages["Tipo"] == "U"].reset_index(drop=True)
    merged["Entrata"] = Entrate["Data"]
    merged["Uscita"] = Uscite["Data"]
    merged["Differenza"]  =  merged["Uscita"] - merged["Entrata"]
    merged["Orario lavorativo entrata"] =  Entrate["Orario lavorativo"]
    merged["Orario lavorativo uscita"] =  Uscite["Orario lavorativo"]

    return  merged, nome


def filter(  fullDf: pd.DataFrame  ):
    #ritorna solo le entrate
    return fullDf[ fullDf["Differenza"] > datetime.timedelta(hours=6) ].reset_index(drop = True)
def conteggio_per_anno(DfAnno: pd.DataFrame):
    Count = DfAnno["Turno"].value_counts().to_dict()

    Count["DomenicheSabatiMattina"] = len(
        DfAnno[(DfAnno["Turno"] == "Mattina") & ((DfAnno["Settimana"] == "Dom") | (DfAnno["Settimana"] == "Sab"))])
    Count["Anno"] = DfAnno.name
    return  Count



# Analyze route
@app.route('/api/conteggio/<extractor>', methods=['POST'])
@cross_origin()
def conteggio(extractor):
    page_extractor: PageExtractor = extractorsTable[extractor]
    files = list(request.files.values())
    app.logger.debug("Processing files: " +  " ".join([file.name for file in files]))
    pages = [page for file in files for page in PDFIterator(file)]
    extractedPages = [page_extractor(p) for p in pages]
    merged , nome = merge(extractedPages)
    Filtrate = filter(merged)

    Filtrate["Turno"]  = Filtrate["Entrata"].dt.round('h').dt.hour.apply(turno)
    Filtrate["Anno"] = Filtrate["Entrata"].dt.year

    Filtrate["Settimana"] = Filtrate["Entrata"].dt.weekday.apply( lambda x: w_days[x])
    Conteggi =  Filtrate.groupby("Anno", group_keys=False).apply(conteggio_per_anno).fillna(0).to_list( )
    return  jsonify( Values = Conteggi  , Nome = nome)


turno_orario=   {
"Mattina": 7  ,
"Pomeriggio": 14,
"Notte": 21,
}

# Example of conversion functions
def time_to_timedelta(t):
    """Convert datetime.time to datetime.timedelta since midnight."""
    return datetime.timedelta(hours=t.hour, minutes=t.minute, seconds=t.second)


@app.route('/api/parse/<extractor>/<what>', methods=['POST'])
@cross_origin()
def parse(extractor, what: str):

    # Validate extractor
    if extractor not in extractorsTable:
        return jsonify({"error": "Invalid extractor"}), 400

    page_extractor = extractorsTable[extractor]

    # Ensure files are provided
    files = list(request.files.values())
    if not files:
        return jsonify({"error": "No files provided"}), 400

    app.logger.debug("Parsing files: " + " ".join([file.name for file in files]))

    # Process PDF pages
    extractors = [  page_extractor(  page ) for file in files for page in PDFIterator(file)]
    df, nome = merge(extractors)
    # Filter by 'Tipo' if 'what' is provided
    if what != "full":
        df = df[ what.lower()]

    # Convert to CSV
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    # Return response
    response = Response(output, mimetype='text/csv')
    response.headers['Content-Disposition'] = f'attachment; filename={nome}.csv'
    return response


def orario_ideale_entrata( row):
    turno = row["Turno"]
    orario_lavorativo = row["Ora lavorativo entrata"]
    if turno == "Mattina":
        ora = 7
    if turno == "Pomeriggio":
        ora =  14
    else:
        ora = 21 if orario_lavorativo >= 3 else 8


    return  row["Entrata"].replace(hour = ora)
def orario_ideale_uscita(row):
    turno = row["Turno"]
    orario_lavorativo = row["Ora lavorativo entrata"]

    if turno == "Mattina":
        ora = 14
    if turno == "Pomeriggio":
        ora = 21 if orario_lavorativo == 7 else 20
    else:
        ora = 7

    return  row["Entrata"].replace(hour = ora, minute = 0)


@app.route('/api/differenziale', methods=['POST'])
@cross_origin()
def differenziale( ):
    files = list(request.files.values())
    app.logger.debug("Processing files: " + " ".join([file.name for file in files]))
    pages = [page for file in files for page in PDFIterator(file)]
    extractors = [PoliclinicoExtractor(p) for p in pages]
    grouped, nome = merge( extractors )

    grouped["Turno"] = grouped["Entrata"].dt.round('h').dt.hour.apply(turno)
    grouped["Ora lavorativo entrata"] = grouped["Orario lavorativo entrata"].dt.round("h").dt.total_seconds() // 3600

    grouped["Orario ideale entrata"] = grouped.apply(orario_ideale_entrata, axis = 1)
    grouped["Orario ideale uscita"] = grouped.apply(orario_ideale_uscita, axis=1)

    #grouped["Data ideale uscita"] = grouped["Data ideale entrata"] +  grouped["Orario lavorativo"]

    #grouped["Differenza uscita"] =  grouped["Data ideale uscita"] - grouped["Uscita"]
    #grouped["Differenza entrata"] = grouped["Data ideale entrata"] - grouped["Entrata"]
    print(grouped["Orario ideale entrata"])
    grouped["Differenza entrata"] =  - ( grouped["Entrata"] - grouped["Orario ideale entrata"] ).dt.total_seconds() / 60
    grouped["Differenza uscita"] = (grouped["Uscita"] - grouped["Orario ideale uscita"]).dt.total_seconds() / 60


    MinutiTagliatiEntrata = np.maximum(np.minimum(grouped["Differenza entrata"], 5), 0)

    MinutiTagliatiUscita = np.maximum(np.minimum(grouped["Differenza uscita"], 5), 0)



    return  jsonify(  entrate = MinutiTagliatiEntrata.sum() ,  uscite = MinutiTagliatiUscita.sum() , Nome = nome )


# Main
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=port)

