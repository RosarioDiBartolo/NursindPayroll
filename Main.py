import datetime
import io
import traceback
from typing import List

import pandas as pd
from flask import Flask, jsonify, send_file,   request, Response
from flask_cors import cross_origin
import requests
import io

from WorkersAnalyzer.BPC.crawler import crawl, mesi, login
from WorkersAnalyzer.Core import PDFIterator, turno
from WorkersAnalyzer.Extractors.PoliclinicoExtractor import PoliclinicoExtractor
from WorkersAnalyzer.Extractors.PisaExtractor import PisaExtractor
from WorkersAnalyzer.Extractors.GaribaldiExtractor import GaribaldiExtractor
from WorkersAnalyzer.Extractors.MarcheExtractor import MarcheExtractor
from WorkersAnalyzer.Extractors.PageExtractor import PageExtractor
from config import app, port

app = Flask(__name__)

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


def merge(ExtractedPages: List[PageExtractor]):

    data = pd.concat( [ extractor.read().with_datetime() for  extractor in ExtractedPages] ).dropna()
    names = {e.name for e in ExtractedPages}
    if len(names) > 1:
        raise Exception("Nomi diversi all'interno delle pagine...")
    nome = names.pop()


    data.drop(data[data["Tipo"] == "M"].index)

    data["Boolean-Type"] = data["Tipo"] == "E"

    data.sort_values(by='Data', ascending=True, inplace=True)

    iter = data.iterrows()
    Entrate = []
    Uscite = []
    for i, row in iter:
        if not row["Boolean-Type"]:
            continue

        for i, newRow in iter:

            if not newRow["Boolean-Type"]:
                Entrate.append(row)
                Uscite.append(newRow)
                break
            else:
                row = newRow

    Entrate = pd.DataFrame(Entrate).reset_index(drop=True)
    Uscite = pd.DataFrame(Uscite).reset_index(drop=True)
    return  Entrate, Uscite, nome

def filter(Entrate, Uscite  ):
    return Entrate[(Uscite["Data"] - Entrate["Data"]) > datetime.timedelta(hours=6)]
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
    Entrate, Uscite, nome = merge(extractedPages)
    Filtrate = filter(Entrate, Uscite)

    Elaborato: pd.DataFrame = Filtrate.assign(Anno=Filtrate["Data"].apply(lambda date: date.year).tolist(),
           Turno= Filtrate["Data"].apply(lambda e: turno(  e.time() )   ).tolist())

    Conteggi =  Elaborato.groupby("Anno", group_keys=False).apply(conteggio_per_anno).fillna(0).to_list( )
    print(Conteggi)
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


def round_to_nearest_hour(td):
    """Round a timedelta to the nearest hour."""
    # Extract total minutes
    total_minutes = td.total_seconds() / 60

    # If minutes are 30 or more, round up, else round down
    if total_minutes % 60 >= 30:
        # Round up by adding the necessary time to get the next hour
        return datetime.timedelta(hours=(td.seconds // 3600) + 1, minutes=0)
    else:
        # Round down
        return datetime.timedelta(hours=td.seconds // 3600, minutes=0)


def differenziale_turni(df,Uscite = False):
    # Calculate EntrateOreMinuti and EntrateUfficiali
    dfOreMinuti = df['Data'].dt.time.apply(time_to_timedelta)
    dfUfficiali = dfOreMinuti.apply( round_to_nearest_hour )
    # Calculate Gaps (differences in timedelta)
    Gaps = ( -1 if Uscite else  1  ) * (dfUfficiali - dfOreMinuti)

    # Handle Anticipi: convert gaps to minutes and apply the min(5) constraint
    Anticipi = Gaps[Gaps > datetime.timedelta(0) ].dropna().apply(lambda x: min(x.total_seconds() / 60, 5))

    return  Anticipi

@app.route('/api/parse/<extractor>/<what>', methods=['POST'])
@cross_origin()
def parse(extractor, what):
    try:
        # Validate extractor
        if extractor not in extractorsTable:
            return jsonify({"error": "Invalid extractor"}), 400

        page_extractor: PageExtractor = extractorsTable[extractor]

        # Ensure files are provided
        files = list(request.files.values())
        if not files:
            return jsonify({"error": "No files provided"}), 400

        app.logger.debug("Processing files: " + " ".join([file.name for file in files]))

        # Process PDF pages
        pages = [page for file in files for page in PDFIterator(file)]
        df = pd.concat([page_extractor(p).read().with_datetime()  for p in pages])
        print("Parsing")
        print(df)
        # Filter by 'Tipo' if 'what' is provided
        if what:
            tipo = "E" if what.lower() == "entrate" else "U"
            df = df[df["Tipo"] == tipo]

        # Convert to CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        # Return response
        response = Response(output, mimetype='text/csv')
        response.headers['Content-Disposition'] = 'attachment; filename=data.csv'
        return response

    except Exception as e:
        app.logger.error(f"Error processing files: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/differenziale', methods=['POST'])
@cross_origin()
def differenziale( ):
    files = list(request.files.values())
    app.logger.debug("Processing files: " + " ".join([file.name for file in files]))
    pages = [page for file in files for page in PDFIterator(file)]
    extractedPages = [PoliclinicoExtractor(p) for p in pages]
    Entrate, Uscite, nome = merge(extractedPages)

    anticipi_entrate = sum( differenziale_turni(Entrate).to_list())


    anticipi_uscite= sum(differenziale_turni(Uscite, Uscite = True).to_list())

    print( anticipi_entrate, anticipi_uscite)
    return  jsonify( entrate = anticipi_entrate ,  uscite = anticipi_uscite , Nome = nome )



# Main
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=port)

