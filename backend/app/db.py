import os
import psycopg2


from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

print("HOST =", os.getenv("DB_HOST"))
print("USER =", os.getenv("DB_USER"))
print("PASSWORD =", os.getenv("DB_PASSWORD"))

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )