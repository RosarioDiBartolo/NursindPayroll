import datetime
import io
import os
import zipfile

import PyPDF2
from flask import Flask, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename
from flask_jwt_extended import  create_access_token, create_refresh_token
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

@app.route("/login", methods = ["POST"])
def login():
    data = request.get_json()

    print(data)

    email = data.get('email')
    password = data.get('password')
    user = users.get(email)

    print(email, password )
    if user and  bcrypt.check_password_hash(  user.password, password)  :
        return jsonify(auth= {"token": create_access_token(identity=email), "type": "Bearer"} ,
 userState = {"email": user.email }  ), 200
    else:
        return jsonify(message='Invalid credentials'), 401
@app.route('/analyze', methods=['POST'])
def process_files_route():
    try:
        now = datetime.datetime.now()
        uploaded_files = request.files.getlist('files')

        if not all(allowed_file(file.filename) for file in uploaded_files):
            return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

        zip_filename = f"download-{now.strftime('%Y%m%d%H%M%S')}.zip"
        in_memory_zip = io.BytesIO()

        with zipfile.ZipFile(in_memory_zip, 'a', zipfile.ZIP_DEFLATED, False) as zipf:
            for file_storage in uploaded_files:
                block = PDFBlock(PyPDF2.PdfReader(file_storage.stream).pages)
                PData, values, name = main(block, PisaExtractor())


                if not secure_filename(file_storage.filename):
                    return jsonify({"error": "Invalid file name"}), 400

                file_name = file_storage.filename.removesuffix(".pdf")

                text = "\n".join([name, values.to_string()])
                zipf.writestr(".".join( (file_name, "txt")), text)

        in_memory_zip.seek(0)
        return send_file(
            in_memory_zip,
            as_attachment=True,
            download_name=zip_filename
        )

    except Exception as e:
        # Log the actual error for debugging purposes
        app.logger.error(str(e))
        return jsonify({"error": "Internal Server Error"}), 500




if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
