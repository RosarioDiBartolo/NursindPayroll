import datetime

from flask import Flask
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS

app = Flask('WorkersAnalyzer')
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this!
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1)

jwt = JWTManager(app)
bcrypt = Bcrypt(app)
CORS(app)