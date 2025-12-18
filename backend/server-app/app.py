import os
import pyodbc
from flask import Flask, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

def get_db_connection():
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        f"SERVER={os.getenv('DB_HOST')},{os.getenv('DB_PORT')};"
        f"DATABASE={os.getenv('DB_NAME')};"
        f"UID={os.getenv('DB_USER')};"
        f"PWD={os.getenv('DB_PASSWORD')};"
    )
    return pyodbc.connect(conn_str, timeout=5)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "DRS backend",
        "message": "Flask is running"
    })

@app.route("/db-health", methods=["GET"])
def db_health():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT 1")
        row = cursor.fetchone()

        cursor.close()
        conn.close()

        if row is None:
            return jsonify({
                "status": "error",
                "database": "connected but query returned no rows"
            }), 500

        return jsonify({
            "status": "ok",
            "database": "connected",
            "result": row[0]
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "database": "not connected",
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
