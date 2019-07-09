// Verwende serielle Debugausgabe mit gegebener Baudrate
#define SERIAL_DEBUG 115200

// Deine WLAN Zugangsdaten
// Achtung: SSID muss kleiner als 32 Zeichen sein!
#define WLAN_SSID "eduroam"
#define WLAN_PASSWORD "PASSWORT"

// Fuer EAP (Extensible Authentication Protocol, z.B. bei eduroam) ebenfalls:
// #define WLAN_IDENTITY "IDMKENNUNG@fau.de"
// #define WLAN_ANONYMOUS_IDENTITY "anonymous@fau.de"

// Wartezeit zwischen Verbindungen in ms
#define WLAN_RECONNECT_DELAY 500
// Anzahl der Versuche
#define WLAN_RECONNECT_TRIES 60

// Server fuer Upload
#define SYNC_HTTP_HOST "i4time.cs.fau.de"
// Uploadinterval (in Sekunden)
#define SYNC_INTERVAL (3600*4)

// NTP (Network Time Protocol) Server
// Achtung: Alle Zeitstempel auf dem Wuerfel sind UTC!
#define SYNC_NTP1 "ntp0.fau.de"
#define SYNC_NTP2 "ntp1.fau.de"
#define SYNC_NTP3 "pool.ntp.org"

// Minimaler Zeitstempel, ab der er als mit NTP synchronisiert betracht werden kann
// 1000000000 = 2001-09-09
#define RTC_TIMESTAMP_THS 1000000000


// Anzahl der kontinuierlich gleichen Accelerometerabfragen, um eine Seite als "stabil" zu sehen
#define SIDE_COUNT 10
// Wartezeit zwischen Accelerometerabfragen
#define SIDE_DELAY 400
// Zuordnung der Seiten ueberschreiben (durch ausprobieren herausfinden)
#define SIDE_MAPPING {1, 6, 4, 3, 2, 5 }

// Maximale Anzahl der gespeicherten Aktionen
// (Wir haben etwas unter 8K RTC Ram und brauchen pro Eintrag 4 Byte)
#define TIMELOG_MAX 768

// Anzahl der Eintraege um eine Synchronisation im WLAN zu versuchen
#define TIMELOG_THRESHOLD 500


// Interrupt Pin fuer Beschleunigungssensor
#define ACCEL_INT_PIN GPIO_NUM_27
// Grenzwert fuer die Klickerkennung
#define ACCEL_CLICK_THS 80
// SPI Cable Select Pin fuer Beschleunigungssensor
#define ACCEL_CS_PIN GPIO_NUM_21

// Status LED auf dem Firebeetle
#define STATUS_LED_PIN GPIO_NUM_2


/* Min/Max Voltage = 3.3V/4.2V
 * Formel fuer ADC Wert:
 *    Voltage/(7.26V)*4095
 * -> ADC 1860/2375
 */
// 100% Batterie
#define BATTERY_MAX 2375
// 0% Batterie
#define BATTERY_MIN 1860
