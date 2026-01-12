import socketio

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2ODA3Mjk2NywianRpIjoiZmUxMjc5YTEtN2E0NS00MGZhLTgzZmYtNjM0ZTMwYmM4YzJiIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NjgwNzI5NjcsImNzcmYiOiIxYTM5OWNmOS1mY2VhLTQ2MmEtYWVhNC01MDM5MTg1NGUzZjYiLCJleHAiOjE3NjgwNzY1NjcsInJvbGUiOiJBRE1JTiJ9.Ehz3vBzFwjedojKsPIiGT8otrEimVWYFvTXv63n5Xns"

sio = socketio.Client()

@sio.event
def connect():
    print("CONNECTED")

@sio.event
def connect_error(data):
    print("CONNECT ERROR:", data)

@sio.event
def disconnect():
    print("DISCONNECTED")

if __name__ == "__main__":
    url = f"http://127.0.0.1:5001?token={TOKEN}"
    sio.connect(url, transports=["websocket"])
    sio.wait()
