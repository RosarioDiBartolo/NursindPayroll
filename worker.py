from redis import Redis
from rq import Queue, Worker

from nursind import create_app


app = create_app()

with app.app_context():
    connection = Redis.from_url(app.config["REDIS_URL"])
    worker = Worker([Queue("crawl", connection=connection)], connection=connection)
    worker.work()
