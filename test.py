import os.path

import requests
from config import port

base = f"http://localhost:{port}/"

res = requests.get(
 base
)
print(res.text)


username = "30105"
password = "cespiti"

request_endpoint = f"{base}/request"
login_endpoint = f"{request_endpoint}/login"

def test_login():


    Cookies = requests.post(
        login_endpoint, json ={
            "username": username,"password": password
        }
    ).json()

    return Cookies

year = 2019
month = 0


def request_file(Cookies):
    return requests.post(request_endpoint, json = dict(username = username, Cookies = Cookies , year = year, month= month ))
