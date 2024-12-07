class ExtractingError(Exception):
    def __init__(self, context, goal ):
        self.context = context
        self.goal = goal
    def __str__(self):
        return f"Errore nel tantativo di estratte la propietà {self.goal} del contesto:\n{self.context}"