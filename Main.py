
import io
import traceback

import requests
from flask import   request, jsonify, send_file
from flask_cors import cross_origin
from config import app
from WorkersAnalyzer.Core import PDFIterator
from WorkersAnalyzer.PisaExtractor import PisaExtractor
from WorkersAnalyzer.UserExtractor import UserExtractor
from WorkersAnalyzer.BPC import crawler


def allowed_file(filename):
    return  filename.endswith('.pdf')

@app.route("/")
def index():
    return "Server running"


@app.route('/login', methods=['POST'])
def login():
    try:
        body = request.get_json()  # Use get_json() instead of json()
        print(body)
        # Assuming 'crawler' is defined and login method returns a session object

        session = crawler.login(body.get('username'), body.get('password'))

        return jsonify( session.cookies.get_dict() )
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'error': 'Failed to process login'}), 500

@app.route('/request' ,methods=['POST']  )
def request_bustapaga():
    try:
        body = request.get_json()  # Use get_json() instead of json()
         # Assuming 'crawler' is defined and login method returns a session object

        session = requests.session()
        session.cookies.update( body.get('cookies') )

        year, month, username = body.get('year'), body.get('month'), body.get('username')

        content = crawler.crawl( session, year, month, username  )

        return send_file(
            io.BytesIO(content),
            as_attachment=True,
            download_name=f"{username}-{year}-{month}.pdf",
            mimetype="application/pdf"
        ), 200

    except Exception as e:
        print(f"Error during request: {e}")
        return jsonify({'error': str(e)}), 500


def pages(files):
    return [page  for file in files for page in  PDFIterator(  file )    ]


@app.route('/analyze', methods=['POST'])
@cross_origin()
def process_files_route():
    try:
        files = list(request.files.values())

        extractor = UserExtractor([PisaExtractor(p) for p in pages(files)])

        Values = extractor.elaborate().apply(
            lambda Anno: Anno["Turno"].value_counts().to_dict()
        ).to_dict()


        return jsonify( Values =  Values , Nome = extractor.name )

    except Exception as e:
        # Log the actual error for debugging purposes

        app.logger.error(traceback.format_exc())
        return jsonify(error = str(e)), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=8080)
