#include <WiFi.h>
#include "esp_wpa2.h"

#include "accelerator.h"
#include "config.h"

const char* wlan_ssid = WLAN_SSID;
const char* sync_http_host = SYNC_HTTP_HOST;

const uint8_t side_translate[6] = SIDE_MAPPING;
RTC_DATA_ATTR uint8_t side_last = 0;
RTC_DATA_ATTR uint8_t timelog_entry = 0;
RTC_DATA_ATTR time_t timelog[TIMELOG_MAX];
RTC_DATA_ATTR time_t wakeup = SYNC_INTERVAL;
RTC_DATA_ATTR unsigned deep_sleep = 0;
RTC_DATA_ATTR unsigned sync_counter = 0;

static_assert(sizeof(time_t) == 4, "time_t Size");

Accelerator accel = Accelerator(ACCEL_INT_PIN);


static uint8_t getVoltage(){
  int val = analogRead(A13);
  Serial.print("Batterie: ");
  Serial.println(val);
  if (val > BATTERY_MAX)
    return 100;
  else if (val < BATTERY_MIN)
    return 0;
  else 
    return (val - BATTERY_MIN) * 100 / (BATTERY_MAX - BATTERY_MIN);
}

static uint8_t getSide(){
  uint8_t state = accel.getMovement();
  for (uint8_t p = 0; p < 6; p++){
    if ((state & 0x3f) == (1 << p))
      return side_translate[p];
  }
  return 0;
}

static uint8_t getStableSide(){
  // Get current side
  uint8_t side = getSide();
  // If changed, wait for stable side
  if (side != side_last) {
    side_last = side;
    // try to save power during sleep
    esp_sleep_enable_timer_wakeup(SIDE_DELAY * 1000);
    // we need SIDE_COUNT stable reads
    for (uint8_t n = 0 ; n < SIDE_COUNT ; n++){
      // try light sleep, fall back to delay
      if (esp_light_sleep_start() != ESP_OK){
        Serial.println("delay");
        delay(SIDE_DELAY);
      }
      // Update Side
      side = getSide();
      // check if stable or reset
      if (side_last != side){
        side_last = side;
        n = 0;
      }
    }
  }
  return side;
}

static bool checkSide(){
  uint8_t side = getStableSide();
  if (timelog_entry == 0 || (timelog_entry < TIMELOG_MAX && side != (timelog[timelog_entry - 1] & 0x7))){
    time_t timestamp;
    time(&timestamp);
    timestamp &= ~(0x7);
    timestamp |= side;
    timelog[timelog_entry++] = timestamp;
    Serial.print("Side: ");
    Serial.println(side);
    return true;
  }
  return false;
}

static void wlanSetup(){
  Serial.print("Connecting to WLAN ");
  Serial.println(wlan_ssid);
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)WLAN_EAP_ANONYMOUS_IDENTITY, strlen(WLAN_EAP_ANONYMOUS_IDENTITY)); 
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)WLAN_EAP_IDENTITY, strlen(WLAN_EAP_IDENTITY));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)WLAN_EAP_PASSWORD, strlen(WLAN_EAP_PASSWORD));
  esp_wpa2_config_t wlan_config = WPA2_CONFIG_INIT_DEFAULT();
  esp_wifi_sta_wpa2_ent_enable(&wlan_config);
  WiFi.begin(wlan_ssid);
}

static bool wlanConnect(){
  for (int c = 0; WiFi.status() != WL_CONNECTED ; c++) {
    delay(WLAN_RECONNECT_DELAY);
    Serial.print(".");
    if (c >= WLAN_RECONNECT_TRIES){
      Serial.println("Keine Verbindung moeglich");
      return false;
    }
  }
  return true;
}

static bool updateTime(){
  // NTP
  time_t now, timestamp;
  time(&now);

  if (!wlanConnect())
    return false;
  
  // Sync
  configTime(0, 0, "ntp0.fau.de", "ntp0.fau.de", "pool.ntp.org");

  // wait
  delay(300);
  
  time(&timestamp);
  
  // check if we have an initial update
  if (now < RTC_TIMESTAMP_THS && timestamp > RTC_TIMESTAMP_THS){
    Serial.println("Update timelog");
    uint32_t delta = timestamp - now;
    // Update entries
    delta &= ~(0x7);
    for (int i = 0; i < timelog_entry; i++)
        timelog[i] += delta;
  }

  return true;
}

static bool uploadData(){
  if (wlanConnect()){
    uint64_t mac =  ESP.getEfuseMac();
    uint8_t voltage = getVoltage();
    time_t now;
    time(&now);
  
    // Debug status
    Serial.printf("mac %04X",(uint16_t)(mac>>32));
    Serial.printf("%08X\n",(uint32_t)mac);
    Serial.print("voltage: ");
    Serial.println(voltage);
    Serial.print("time: ");
    Serial.println(now);
    Serial.print("side: ");
    Serial.println(side_last);
    Serial.println("data:");
    for (int i = 0; i < timelog_entry - 1; i++){
      Serial.print("\t");
      Serial.print(i);
      Serial.print(".\t");
      Serial.print(timelog[i] & 0x7);
      Serial.print(" - ");
      Serial.println(timelog[i] & ~(0x7));
    } 
  
    // Server kontaktieren
    Serial.print("Senden an ");
    Serial.println(sync_http_host);
    WiFiClient client;
    if (client.connect(sync_http_host, 80)) {
      client.print("POST /");
      client.printf("%04X",(uint16_t)(mac>>32));
      client.printf("%08X",(uint32_t)mac);
      client.print("/upload HTTP/1.1\r\nHost: ");
      client.print(sync_http_host);
      client.print("\r\nUser-Agent: i4Zeitwuerfel\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: ");
      client.print(timelog_entry == 0 ? 15 : (17 + (timelog_entry - 1) * 9));
      client.print("\r\n\r\n");
      client.printf("v=%02X", voltage);
      client.printf("&t=%08X", now);
      if (timelog_entry > 0){
        client.printf("&d=%08X",timelog[0]);
        for (int i = 1; i < timelog_entry; i++)
          client.printf("+%08X",timelog[i]);
      }
  
      while (client.connected()) {
        // Check header
        String line = client.readStringUntil('\n');
        Serial.println(line);
        if (line == "HTTP/1.1 200 OK\r" || line == "HTTP/1.0 200 OK\r"){
          Serial.println("HTTP OK ");
          return true;
        }
        if (line == "\r")
          break;
      }
    } else
      Serial.println("Verbindungsprobleme");
  }
  return false;
}

static bool sync(){
  wlanSetup();
  
  if (!wlanConnect())
    return false;

  bool ret = true;

  Serial.print("IP: "); 
  Serial.println(WiFi.localIP());   //inform user about his IP address


  delay(WLAN_RECONNECT_DELAY);
  // NTP
  if (!updateTime()){
    ret = false;
    Serial.println("NTP fehlgeschlagen");
  }
  
  if (uploadData()){
    // Reset entries;
    timelog[0]=timelog[timelog_entry - 1];
    timelog_entry = 1;
    Serial.println("HTTP Upload erfolgreich");
  } else {
    ret = false;
    Serial.println("HTTP Upload fehlgeschlagen");
  }

  WiFi.disconnect(true);
    
  return ret;
}

void setup(){
  Serial.begin(9600);
   
  delay(10);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, HIGH);

  if (!accel.begin()){
    Serial.println("Beschleunigungssensor spinnt.");
  } else {
    accel.setClick(3, ACCEL_CLICK_THS);
    accel.setMovement();
  }

  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  switch(wakeup_reason){
    case ESP_SLEEP_WAKEUP_EXT0 : Serial.println("Aufgeweckt durch EXT0"); break;
    case ESP_SLEEP_WAKEUP_EXT1 : Serial.println("Aufgeweckt durch EXT1"); break;
    case ESP_SLEEP_WAKEUP_TIMER : Serial.println("Aufgeweckt durch Timer"); break;
    case ESP_SLEEP_WAKEUP_TOUCHPAD : Serial.println("Aufgeweckt durch Touchpad o.O"); break;
    case ESP_SLEEP_WAKEUP_ULP : Serial.println("Aufgeweckt durch ULP o.O"); break;
    default : Serial.printf("Wach: %d\n",wakeup_reason); break;
  }

  // Do we need an WLAN update?
  bool update = wakeup_reason == ESP_SLEEP_WAKEUP_TIMER || wakeup_reason == ESP_SLEEP_WAKEUP_UNDEFINED;

  // check side (and check WLAN update)
  if (checkSide() && timelog_entry > TIMELOG_MAX / 2)
     update = true;    

  // check tap
  uint8_t click = accel.getClick();
  if (click != 0 && (click & 0x30)){
    Serial.println("Klickaktualisierung");
    update = true;
  }

  // Timer wakeup
  time_t now;
  time(&now);
  if (now >= wakeup)
    update = true;

  // do update
  if (update){
     Serial.print("Sync #");
     Serial.println(++sync_counter);
     sync();
      
   
     // New Timer Wakeup
     time(&now);
     wakeup = now + SYNC_INTERVAL;
  
     // safety - if wlan connection was slow, lets check current side, maybe flipped
     checkSide();
  }

  // Prepare for sleep
  esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_ON);
  gpio_pullup_dis(ACCEL_INT_PIN);
  gpio_pulldown_en(ACCEL_INT_PIN);
  esp_sleep_enable_ext1_wakeup(1 << ACCEL_INT_PIN, ESP_EXT1_WAKEUP_ANY_HIGH);
  // calculate next wakeup
  if (wakeup - now < 1) 
    wakeup = now + 1;
  esp_sleep_enable_timer_wakeup((wakeup - now) * 1000000ULL);
  
  // Sleep
  digitalWrite(STATUS_LED_PIN, LOW);
  Serial.print("Schlafen #");
  Serial.println(++deep_sleep);
  esp_deep_sleep_start();
}

void loop(){
  //This is not going to be called
}
