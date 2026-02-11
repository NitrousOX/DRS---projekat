from app import create_app
from extensions import socketio
import os

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=port, 
        debug=True,
        use_reloader=False,
        log_output=True
    )
