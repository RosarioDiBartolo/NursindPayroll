import json
import os
from datetime import datetime

from .crawler import login, crawl, mesi


class FileCache:
    def __init__(self, path):
        self.path = path

        if os.path.exists(path):
            with open(self.path, "r") as f:
                self.data = json.load(f)
        else:
            self.data = {}
    def get(self, key, v):
        return  self.data.get(key, v)
    def __getitem__(self, item):
        return self.data[item]
    def __setitem__(self, key, value):
        self.data[key] = value
    def close(self):
        with open(self.path, "w") as f:
            json.dump(self.data, f)



now = datetime.now()
current_year = now.year
current_month = now.month
def MonthsRange(start_year, start_month):
    for year in range(start_year, current_year + 1):
        if year == current_year:
            r = range(start_month, current_month + 1)
        else:
            r = range(start_month, 12)
        for month_idx in r:
            month = mesi[month_idx]
            yield (year, month, month_idx )



def scrape(name, username, password):



    results_folder = f"./{name}"

    if not os.path.exists(results_folder):
        os.makedirs(results_folder)

    status_path = os.path.join(results_folder, f"{name}-scrape-log.json")
    status = FileCache(status_path)


    start_year = status.get("start-year", 2019 )
    start_month = status.get("start-month", 0)
    print("Crawling data for:", name)
    print("Password:", password)
    print("Username", username)
    print(f"Starting from: {mesi[start_month]} {start_year}")
    session = login(username, password)
    for year in range(start_year, current_year + 1):
        try:

            if year == current_year:
                r = range(start_month, max_month + 1)
            else:
                r = range(start_month, 12)
            for month_idx in r:
                month = mesi[month_idx]

                result = crawl(session, year, month, username)

                with open(f"{results_folder}/{year}-{month_idx}.pdf", "wb") as f:
                    f.write(result.content)

        except Exception as err:
            print(err)
            status["error"] = str(err)


        finally:
            status["start-year"] = year
            status["start-month"] = month_idx or 0
            status.close()

if __name__ == '__main__':
    scrape("Unknown","18629" , "prova")

