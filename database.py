import sqlite3

conn = sqlite3.connect('aqi.db')
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS data (
    time TEXT,
    temperature REAL,
    humidity REAL,
    pm2_5 REAL,
    gas REAL
)
""")

conn.commit()
conn.close()

print("Database & Table Created!")