#include <WiFi.h>
#include "esp_wifi.h"
#include "esp_bt.h"
#include "esp_wpa2.h"
#include "esp_sleep.h"
#include "soc/rtc_io_reg.h"
#include "driver/gpio.h"
#include "driver/rtc_io.h"
#include "driver/adc.h"

#include "accelerometer.h"
#include "config.h"

#ifdef SERIAL_DEBUG
#define SDBG(MSG) Serial.print(MSG)
#define SDBGF(MSG, ...) Serial.printf(MSG, __VA_ARGS__)
#define SDBGLN(MSG) Serial.println(MSG)
#else
#define SDBG(MSG)
#define SDBGF(MSG, ...)
#define SDBGLN(MSG)
#endif

const char* wlan_ssid = WLAN_SSID;
const char* sync_http_host = SYNC_HTTP_HOST;

const uint8_t side_translate[6] = SIDE_MAPPING;
RTC_DATA_ATTR uint8_t timelog_entry = 0;
RTC_DATA_ATTR time_t timelog[TIMELOG_MAX];
RTC_DATA_ATTR time_t wakeup = SYNC_INTERVAL;
RTC_DATA_ATTR unsigned deep_sleep = 0;
RTC_DATA_ATTR unsigned sync_counter = 0;

static_assert(sizeof(time_t) == 4, "time_t Size");

Accelerometer accel = Accelerometer(ACCEL_CS_PIN);


static uint8_t getVoltage(){
  analogSetAttenuation(ADC_11db);
  analogReadResolution(12);
  int val = analogRead(A0);
  SDBG("Batterie: ");
  SDBGLN(val);
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
  uint8_t side_last = getSide();
  // try to save power during sleep
  esp_sleep_enable_timer_wakeup(SIDE_DELAY * 1000);
  // we need SIDE_COUNT stable reads
  for (uint8_t n = 0 ; n < SIDE_COUNT ; n++){
    // try light sleep, fall back to delay
    if (esp_light_sleep_start() != ESP_OK){
      SDBGLN("delay");
      delay(SIDE_DELAY);
    }
    // Update Side
    uint8_t side = getSide();
    // check if stable or reset
    if (side_last != side){
      side_last = side;
      n = 0;
    }

  }
  return side_last;
}


/*! \brief Check active side (and create entry in timelog if changed)
 *  \param forceNewEntry create a new entry in timelog even if the side hasnt changed
 *  \return true if a new entry was created
 */
static bool checkSide(bool forceNewEntry = false){
  uint8_t side = getStableSide();
  if (timelog_entry < TIMELOG_MAX && (forceNewEntry || timelog_entry == 0 || side != (timelog[timelog_entry - 1] & 0x7))){
    time_t timestamp;
    time(&timestamp);
    timestamp &= ~(0x7);
    timestamp |= side;
    timelog[timelog_entry++] = timestamp;
    SDBG("Derzeit akive Seite: ");
    SDBGLN(side);
    return true;
  }
  return false;
}

/*! \brief Connect to WLAN using given credentials
 */
static void wlanSetup(){
  // Disconnect previous WLAN session (although there shouldn't be any)
  WiFi.disconnect(true);

  SDBG("Connecting to WLAN ");
  SDBG(wlan_ssid);
  WiFi.mode(WIFI_STA);
  #ifdef WLAN_IDENTITY
  SDBGLN(" using EAP");
  // Use EAP
  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)WLAN_ANONYMOUS_IDENTITY, strlen(WLAN_ANONYMOUS_IDENTITY)); 
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)WLAN_IDENTITY, strlen(WLAN_IDENTITY));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)WLAN_PASSWORD, strlen(WLAN_PASSWORD));
  esp_wpa2_config_t wlan_config = WPA2_CONFIG_INIT_DEFAULT();
  esp_wifi_sta_wpa2_ent_enable(&wlan_config);
  WiFi.begin(wlan_ssid);
  #else
  SDBGLN();
  // Simple connection
  WiFi.begin(wlan_ssid, WLAN_PASSWORD);
  #endif
}

/*! \brief Wait for WLAN connection
 *  \return true on success, false if timed out
 */
static bool wlanConnect(){
  int stat, prev = 0;
  for (int c = 0; (stat = WiFi.status()) != WL_CONNECTED ; c++) {
    delay(WLAN_RECONNECT_DELAY);
    if (stat != prev) {
      prev = stat;
      switch (stat){
        case WL_NO_SHIELD: SDBG("[no WLAN Shield]"); break;
        case WL_IDLE_STATUS: SDBG("[WLAN Idle]"); break;
        case WL_NO_SSID_AVAIL: SDBG("[no WLAN SSID]"); break;
        case WL_SCAN_COMPLETED: SDBG("[WLAN scan completed]"); break;
        case WL_CONNECT_FAILED: SDBG("[WLAN connect failed]"); break;
        case WL_CONNECTION_LOST: SDBG("[WLAN connection lost]"); break;
        case WL_DISCONNECTED: SDBG("[WLAN disconnected]"); break;
        default: SDBG("[WLAN status unknown]");
      }
    }
    SDBG(".");
    if (c >= WLAN_RECONNECT_TRIES){
      SDBGLN("Keine WLAN  Verbindung moeglich");
      return false;
    }
  }
  return true;
}

/*! \brief Update RTC using NTP
 * \return false if no WLAN connection available
 */
static bool updateTime(){
  // NTP
  time_t now, timestamp;
  time(&now);

  if (!wlanConnect())
    return false;
  
  // Sync
  configTime(0, 0, SYNC_NTP1, SYNC_NTP2, SYNC_NTP3);

  // wait
  delay(300);
  
  time(&timestamp);
  
  // check if we have an initial update
  if (now < RTC_TIMESTAMP_THS && timestamp > RTC_TIMESTAMP_THS){
    SDBGLN("Aktualisiere Timelog mit neuer Uhrzeit");
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
    SDBGF("mac %04X",(uint16_t)(mac>>32));
    SDBGF("%08X\n",(uint32_t)mac);
    SDBG("voltage: ");
    SDBGLN(voltage);
    SDBG("time: ");
    SDBGLN(now);
    SDBGLN("data:");
    for (int i = 0; i < timelog_entry; i++){
      SDBG("\t");
      SDBG(i);
      SDBG(".\t");
      SDBG(timelog[i] & 0x7);
      SDBG(" - ");
      SDBGLN(timelog[i] & ~(0x7));
    } 
  
    // Server kontaktieren
    SDBG("Senden an ");
    SDBGLN(sync_http_host);
    WiFiClient client;
    client.setTimeout(1500);
    if (client.connect(sync_http_host, 80)) {
      client.print("POST /");
      client.printf("%04X",(uint16_t)(mac>>32));
      client.printf("%08X",(uint32_t)mac);
      client.print("/upload HTTP/1.1\r\nHost: ");
      client.print(sync_http_host);
      client.print("\r\nUser-Agent: i4Zeitwuerfel\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: ");
      client.print(timelog_entry == 0 ? 15 : (17 + timelog_entry * 9));
      client.print("\r\n\r\n");
      client.printf("v=%02X", voltage);
      client.printf("&t=%08X", now);
      if (timelog_entry > 0){
        client.printf("&d=%08X",timelog[0]);
        for (int i = 1; i < timelog_entry; i++)
          client.printf("+%08X",timelog[i]);
      }
  
      for (int t = 0; t<20 && client.connected();t++) {
        // Check header
        SDBGLN(t);
        String line = client.readStringUntil('\n');
        SDBGLN(line);
        if (line == "HTTP/1.1 200 OK\r" || line == "HTTP/1.0 200 OK\r"){
          SDBGLN("HTTP OK ");
          return true;
        }
        if (line == "\r")
          break;
      }
    } else
      SDBGLN("Verbindungsprobleme");
  }
  return false;
}

static bool sync(){
  wlanSetup();
  
  if (!wlanConnect())
    return false;

  bool ret = true;

  SDBG("IP: "); 
  SDBGLN(WiFi.localIP());   //inform user about his IP address


  delay(WLAN_RECONNECT_DELAY);
  // NTP
  if (!updateTime()){
    ret = false;
    SDBGLN("NTP fehlgeschlagen");
  }
  
  if (uploadData()){
    // Reset entries;
    timelog[0]=timelog[timelog_entry - 1];
    timelog_entry = 1;
    SDBGLN("HTTP Upload erfolgreich");
  } else {
    ret = false;
    SDBGLN("HTTP Upload fehlgeschlagen");
  }

  WiFi.disconnect(true);
    
  return ret;
}

void setup(){
  #ifdef SERIAL_DEBUG
  // Initialize Serial connection for debug output
  Serial.begin(SERIAL_DEBUG);
  #endif

  // Wait 10 ms
  delay(10);

  // Light blue LED (on FireBeetle) 
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, HIGH);

  // Set up Accelerometer
  if (!accel.begin()){
    SDBGLN("Beschleunigungssensor antwortet nicht.");
  } else {
    //accel.setClickInterrupt(3, ACCEL_CLICK_THS);
    accel.setMovementInterrupt();
  }

  // Get Wakeup source
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  switch(wakeup_reason){
    // Valid
    case 0: SDBGLN("Aufgeweckt durch Neustart"); break;
    case ESP_SLEEP_WAKEUP_EXT0 : SDBGLN("Aufgeweckt durch EXT0"); break;
    case ESP_SLEEP_WAKEUP_TIMER : SDBGLN("Aufgeweckt durch Timer"); break;
    // Invalid
    case ESP_SLEEP_WAKEUP_EXT1 : SDBGLN("Aufgeweckt durch EXT1 (sollte nicht passieren)"); break;
    case ESP_SLEEP_WAKEUP_TOUCHPAD : SDBGLN("Aufgeweckt durch Touchpad (sollte nicht passieren)"); break;
    case ESP_SLEEP_WAKEUP_ULP : SDBGLN("Aufgeweckt durch ULP (sollte nicht passieren)"); break;
    default : SDBGF("Aufgeweckt: %d (sollte nicht passieren)\n", wakeup_reason); break;
  }

  // Do we need an WLAN synchronization?
  bool update = wakeup_reason == ESP_SLEEP_WAKEUP_TIMER || wakeup_reason == ESP_SLEEP_WAKEUP_UNDEFINED || timelog_entry > TIMELOG_MAX;

  // check tap
  uint8_t click = accel.getClick();
  if (click != 0 && (click & 0x30)){
    SDBGLN("Synchronisiere aufgrund von Klopfen");
    update = true;
  }

  // Timer wakeup
  time_t now;
  time(&now);
  if (now >= wakeup)
    update = true;

  // check side
  checkSide(update);

  // do update
  if (update){
     SDBG("Sync #");
     SDBGLN(++sync_counter);
     sync();
      
   
     // New Timer Wakeup
     time(&now);
     wakeup = now + SYNC_INTERVAL;
  
     // safety - if wlan connection was slow, lets check current side again, maybe it has been flipped meanwhile
     checkSide();
  }

  // Prepare for sleep
  esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_ON);
  rtc_gpio_isolate(ACCEL_INT_PIN);
  
  esp_sleep_enable_ext0_wakeup(ACCEL_INT_PIN, 1);
  // calculate next wakeup
  if (wakeup - now < 1) 
    wakeup = now + 1;
  esp_sleep_enable_timer_wakeup((wakeup - now) * 1000000ULL);
  

  SDBG("Schlafen #");
  SDBGLN(++deep_sleep);
  esp_wifi_stop();  
  esp_bt_controller_disable();
  adc_power_off();
  esp_deep_sleep_start();
}

void loop(){
  // This is never going to be called due to deep sleep.
}
