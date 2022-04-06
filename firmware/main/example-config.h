// Verwende serielle Debugausgabe mit gegebener Baudrate
// (falls auskommentiert wird ohne Debugausgabe übersetzt)
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
#define SYNC_HOST "i4time.cs.fau.de"
// Port fuer die Verbindung
#define SYNC_PORT 443
// Context auf dem Webserver
#define SYNC_CONTEXT "/"
// HTTPS auf 1 setzen um es einzuschalten
#define ENABLE_HTTPS 1
// Root Zertifikat des Webservers (DST Root CA X3, Let's encrypt)
#define ROOT_CERTIFICATE "-----BEGIN CERTIFICATE-----\n" \
"MIIDSjCCAjKgAwIBAgIQRK+wgNajJ7qJMDmGLvhAazANBgkqhkiG9w0BAQUFADA/\n" \
"MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT\n" \
"DkRTVCBSb290IENBIFgzMB4XDTAwMDkzMDIxMTIxOVoXDTIxMDkzMDE0MDExNVow\n" \
"PzEkMCIGA1UEChMbRGlnaXRhbCBTaWduYXR1cmUgVHJ1c3QgQ28uMRcwFQYDVQQD\n" \
"Ew5EU1QgUm9vdCBDQSBYMzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\n" \
"AN+v6ZdQCINXtMxiZfaQguzH0yxrMMpb7NnDfcdAwRgUi+DoM3ZJKuM/IUmTrE4O\n" \
"rz5Iy2Xu/NMhD2XSKtkyj4zl93ewEnu1lcCJo6m67XMuegwGMoOifooUMM0RoOEq\n" \
"OLl5CjH9UL2AZd+3UWODyOKIYepLYYHsUmu5ouJLGiifSKOeDNoJjj4XLh7dIN9b\n" \
"xiqKqy69cK3FCxolkHRyxXtqqzTWMIn/5WgTe1QLyNau7Fqckh49ZLOMxt+/yUFw\n" \
"7BZy1SbsOFU5Q9D8/RhcQPGX69Wam40dutolucbY38EVAjqr2m7xPi71XAicPNaD\n" \
"aeQQmxkqtilX4+U9m5/wAl0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNV\n" \
"HQ8BAf8EBAMCAQYwHQYDVR0OBBYEFMSnsaR7LHH62+FLkHX/xBVghYkQMA0GCSqG\n" \
"SIb3DQEBBQUAA4IBAQCjGiybFwBcqR7uKGY3Or+Dxz9LwwmglSBd49lZRNI+DT69\n" \
"ikugdB/OEIKcdBodfpga3csTS7MgROSR6cz8faXbauX+5v3gTt23ADq1cEmv8uXr\n" \
"AvHRAosZy5Q6XkjEGB5YGV8eAlrwDPGxrancWYaLbumR9YbK+rlmM6pZW87ipxZz\n" \
"R8srzJmwN0jP41ZL9c8PDHIyh8bwRLtTcm1D9SZImlJnt1ir/md2cXjbDaJWFBM5\n" \
"JDGFoqgCWjBH4d1QB7wCCZAA62RjYJsWvIjJEubSfZGL+T0yjWW06XyxV3bqxbYo\n" \
"Ob8VZRzI9neWagqNdwvYkQsEjgfbKbYK7p2CNTUQ\n" \
"-----END CERTIFICATE-----\n"

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


// LiPo minimum/maximum voltage in mV
#define BATTERY_MAX 4200
#define BATTERY_MIN 3200

// ADC default Vref (fallback in case no reference values in eFuse)
#define DEFAULT_VREF 1100
