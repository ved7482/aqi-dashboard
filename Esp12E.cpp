#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <SoftwareSerial.h>

// Software serial (RX, TX)
SoftwareSerial mySerial(D6, D5); // RX=D6, TX=D5

// WIFI
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT
// const char* mqtt_server = "broker.hivemq.com";
const char* mqtt_server = "192.168.1.5";  //e.g.

WiFiClient espClient;
PubSubClient client(espClient);

String data = "";

// WIFI
void setup_wifi() {
  Serial.begin(115200);
  mySerial.begin(9600);

  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);

  int retry = 0;

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    retry++;

    if (retry > 30) {
      Serial.println("\nFailed to connect WiFi");
      Serial.print("Status: ");
      Serial.println(WiFi.status());
      return;
    }
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// MQTT reconnect
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT...");
    
    if (client.connect("ESP8266Client")) {
      Serial.println(" Connected!");
    } else {
      Serial.print(" Failed, rc=");
      Serial.print(client.state());   
      Serial.println(" retrying...");
      delay(2000);
    }
  }
}

void setup() {
  WiFi.mode(WIFI_STA);   

  setup_wifi();      
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  while (mySerial.available()) {
    char c = mySerial.read();

    if (c == '\n') {
      Serial.println("RAW DATA: " + data);

      float t = 0, h = 0, pm = 0, gas = 0;

      sscanf(data.c_str(), "%f,%f,%f,%f", &t, &h, &pm, &gas);

      Serial.print("Parsed: ");
      Serial.print(t);
      Serial.print(" ");
      Serial.print(h);
      Serial.print(" ");
      Serial.print(pm);
      Serial.print(" ");
      Serial.println(gas);

      String payload = "{";
      payload += "\"temperature\":" + String(t) + ",";
      payload += "\"humidity\":" + String(h) + ",";
      payload += "\"pm2_5\":" + String(pm) + ",";
      payload += "\"gas\":" + String(gas);
      payload += "}";

      client.publish("aqi/data", payload.c_str());
      Serial.println(payload);

      data = "";
    } 
    else {
      data += c;
    }
  }
}