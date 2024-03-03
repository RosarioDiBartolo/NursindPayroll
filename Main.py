import datetime
import io
import zipfile

import PyPDF2
import pandas
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from config import app, bcrypt
from WorkersAnalyzer.main import main
from WorkersAnalyzer.Core import PDFBlock
from WorkersAnalyzer.Extractors.PisaExtractor import PisaExtractor
import traceback


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


        json = values.to_dict()



        json["Nome"] = name

        print(json)
        return jsonify(  json ), 200

    except Exception as e:
        # Log the actual error for debugging purposes

        app.logger.error(traceback.format_exc())
        return jsonify(error = "Internal Server Error"), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=8080)
