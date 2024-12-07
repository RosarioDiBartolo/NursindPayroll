users = """Irene Milazzo
2059 iremil66""".split("\n\n")

def extract_data(user):

    name, credentials = user.split("\n")
    username , password = credentials.split()
    return name,username , password
users = list(map(extract_data, users ))


if __name__ == '__main__':

    print(users)

