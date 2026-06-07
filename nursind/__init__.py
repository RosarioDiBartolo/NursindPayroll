from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db, init_sqlite, migrate_legacy_schema


def create_app(config_object=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_object)

    db.init_app(app)
    init_sqlite()
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from .routes import api

    app.register_blueprint(api)

    with app.app_context():
        migrate_legacy_schema()
        db.create_all()

    return app
