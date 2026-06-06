 
import traceback

import numpy as np
from flask import Flask, jsonify, send_file,   request, Response
from flask_cors import cross_origin, CORS
import requests
import io

from WorkersAnalyzer.BPC.crawler import crawl, mesi, login
 
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
 

 

  

# Main
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=port)

