import os
import socket
from contextlib import closing
import uvicorn
from dotenv import load_dotenv

def get_free_port(default=8000):
    """Try to bind to default; if taken, let OS assign a free port"""
    try:
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            s.bind(("", default))
            return default
    except OSError:
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            s.bind(("", 0))  # auto-pick a free port
            return s.getsockname()[1]

if __name__ == "__main__":
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../config/.env.shared"))
    PORT_FROM_ENV = os.getenv("BACKEND_PORT");
    print(f"Trying to load env file:{PORT_FROM_ENV}")
    free_port = get_free_port()
    BACKEND_PORT = int(os.getenv("BACKEND_PORT", free_port))
    print(f"Starting backend on http://localhost:{BACKEND_PORT}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=BACKEND_PORT, reload=True)

