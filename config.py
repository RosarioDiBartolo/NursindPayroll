from flask import Flask
from flask_cors import CORS

# Create Flask app
app = Flask(__name__)

# Configure Flask app
app.config['CORS_HEADERS'] = 'Content-Type'

# Enable CORS for all routes
CORS(app)
port = 8080