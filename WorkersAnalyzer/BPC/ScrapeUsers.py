from Users import users
from scrape_user import scrape
for name, username, password in users:
    try:
        scrape(name, username, password)
    except Exception as err:
        print(err)