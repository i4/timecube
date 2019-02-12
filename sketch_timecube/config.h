// Deine WLAN Zugangsdaten
#define WLAN_EAP_IDENTITY "IDMKENNUNG@fau.de"
#define WLAN_EAP_PASSWORD "PASSWORT"

#define WLAN_EAP_ANONYMOUS_IDENTITY "anonymous@fau.de"
#define WLAN_SSID "eduroam"
// Wartezeit zwischen Verbindungen in ms
#define WLAN_RECONNECT_DELAY 500
// Anzahl der Versuche
#define WLAN_RECONNECT_TRIES 60

// Server fuer Upload
#define SYNC_HTTP_HOST "i4time.cs.fau.de"
// Uploadinterval (in Sekunden)
#define SYNC_INTERVAL (3600*4)

// Anzahl der kontinuierlich gleichen Accelerometerabfragen, um eine Seite als "stabil" zu sehen
#define SIDE_COUNT 10
// Wartezeit zwischen Accelerometerabfragen
#define SIDE_DELAY 400
// Zuordnung der Seiten (ausprobieren)
#define SIDE_MAPPING {1, 6, 4, 3, 2, 5 }

// Maximale Anzahl der Timelogeintraege
// (Wir haben etwas unter 8K RTC Ram und brauchen pro Eintrag 4 Byte)
#define TIMELOG_MAX 768

// Interrupt Ping fuer Beschleunigungssensor
#define ACCEL_INT_PIN GPIO_NUM_27
// Grenzwert fuer die Klickerkennung
#define ACCEL_CLICK_THS 80

// Minimale Zeit, ab der ein Zeitstempel als NTP synchronisiert betracht werden kann
#define RTC_TIMESTAMP_THS 1000000000

// Status LED 
#define STATUS_LED_PIN GPIO_NUM_13


/* Min/Max Voltage = 3.2V/4.2V
 * Formel fuer ADC Wert:
 *    Voltage/(7.26V)*4095
 * -> ADC 1800/2375
 */
// 100% Batterie
#define BATTERY_MAX 2375
// 0% Batterie
#define BATTERY_MIN 1800
