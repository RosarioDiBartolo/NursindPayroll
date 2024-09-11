import io
import traceback
from flask import Flask, jsonify, send_file,    request
from flask_cors import cross_origin
import requests
from WorkersAnalyzer.BPC import crawler
from WorkersAnalyzer.BPC.crawler import crawl, mesi
from WorkersAnalyzer.Core import PDFIterator
from WorkersAnalyzer.Extractors.PoliclinicoExtractor import PoliclinicoExtractor
from WorkersAnalyzer.Extractors.PisaExtractor import PisaExtractor
from WorkersAnalyzer.Extractors.UserExtractor import UserExtractor
from WorkersAnalyzer.Extractors.GaribaldiExtractor import GaribaldiExtractor
from WorkersAnalyzer.Extractors.MarcheExtractor import MarcheExtractor

from config import app, port

app = Flask(__name__)

# Routes
@app.route("/")
def index():
    return "Server running"

# Session Storage
CrawlingSessions = dict()

# Login route
@app.route('/request/login', methods=['POST'])
@cross_origin()
def login():
    body = request.get_json()
    username, password = body.get("username", None), body.get("password", None)
    if username and password:
        session = crawler.login(username, password)
        cookies = requests.utils.dict_from_cookiejar(session.cookies)
        return jsonify(cookies), 200
    return jsonify({'message': 'Missing username or password'}), 400

@app.route('/request', methods=['POST'])
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

# Process year function
def process_year(Anno):
    Count = Anno["Turno"].value_counts().to_dict()
    Count["DomenicheMattina"] = len(Anno[(Anno["Turno"] == "Mattina") & ((Anno["Settimana"] == "Dom") | (Anno["Settimana"] == "Sab"))])
    return Count

# Analyze route
@app.route('/analyze/<extractor>', methods=['POST'])
@cross_origin()
def process_files_route(extractor):
    page_extractor = extractorsTable[extractor]
    files = list(request.files.values())
    app.logger.debug("Processing files: " +  " ".join([file.name for file in files]))
    pages = [page for file in files for page in PDFIterator(file)]

    User = UserExtractor([page_extractor(p) for p in pages])
    Anni = User.elaborate()
    Values = Anni.apply(process_year).to_dict()

    return jsonify(Values=Values, Nome=User.name)

# Main
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=port)

