from config import bcrypt

SPassword = "<PASSWORD>"

SEmail = "<EMAIL>"


class User:
    def __init__(self, e, p):
        self.email = e
        self.password =  bcrypt.generate_password_hash(p)
        pass


SUser = User(SEmail, SPassword)

class UsersHandler:
    def __init__(self):
        pass

    def get(self, Email):
        if Email == SEmail:
            return SUser
