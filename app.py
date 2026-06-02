from flask import Flask, render_template, jsonify
import sqlite3
import json
import paho.mqtt.client as mqtt
from datetime import datetime

app = Flask(__name__)

# ===== MQTT CALLBACKS =====

def on_connect(client, userdata, flags, rc):
    print("MQTT CONNECTED, code:", rc)
    client.subscribe("aqi/data")


def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())

        print("MQTT RECEIVED:", data)
        print("INSERTING:", data)

        conn = sqlite3.connect('aqi.db')
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO data (time, temperature, humidity, pm2_5, gas)
            VALUES (?, ?, ?, ?, ?)
        """, (
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data['temperature'],
            data['humidity'],
            data['pm2_5'],
            data['gas']
        ))

        conn.commit()
        conn.close()

        print("Data inserted into DB")

    except Exception as e:
        print("ERROR:", e)


# ===== MQTT SETUP =====
# client = mqtt.Client()
client = mqtt.Client(protocol=mqtt.MQTTv311)

client.on_connect = on_connect   # IMPORTANT
client.on_message = on_message

client.connect("broker.hivemq.com", 1883, 60)
client.loop_start()


# ===== ROUTES =====

@app.route("/")
def home():
    return render_template("index.html")


@app.route('/api/data')
def get_data():
    conn = sqlite3.connect('aqi.db')
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM data ORDER BY time DESC LIMIT 1")
    row = cursor.fetchone()

    conn.close()

    if row is None:
        return jsonify({
            "time": "No Data",
            "temperature": 0,
            "humidity": 0,
            "pm2_5": 0,
            "gas": 0
        })

    return jsonify({
        "time": row[0],
        "temperature": row[1],
        "humidity": row[2],
        "pm2_5": row[3],
        "gas": row[4]
    })


# ===== RUN =====
if __name__ == "__main__":
    app.run(debug=True)