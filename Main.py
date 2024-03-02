import datetime
import io
import zipfile

import PyPDF2
import pandas
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from UserInfo import UsersHandler
from config import app, bcrypt
from WorkersAnalyzer.main import main
from WorkersAnalyzer.Core import PDFBlock
from WorkersAnalyzer.Extractors.PisaExtractor import PisaExtractor
users  = UsersHandler()

def allowed_file(filename):
    return  filename.endswith('.pdf')

@app.route("/")
def index():
    return "Server running"


@app.route('/analyze', methods=['POST'])
@cross_origin()
def process_files_route():
    try:
        file = request.files['file']

        if not allowed_file(file.filename):
            return jsonify(error = "File type not allowed: only pdf files are allowed...")

        block = PDFBlock.from_file(file)

        PData, values, name = main(block, PisaExtractor() )

        return jsonify( values = values.to_json() , name = name ), 200

    except Exception as e:
        # Log the actual error for debugging purposes
        app.logger.error(str(e))
        return jsonify(error = "Internal Server Error"), 500




