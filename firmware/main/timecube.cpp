// Copyright (c) 2019 Laura Lawniczak, Christian Eichler, Bernhard Heinloth
// SPDX-License-Identifier: AGPL-3.0-only

#include "config.h"

#include <Arduino.h>
#include <esp_adc_cal.h>
#include <esp_wifi.h>
#include <esp_wpa2.h>
#include <esp_sleep.h>
#include <driver/gpio.h>
#include <driver/rtc_io.h>
#include <driver/adc.h>

#if ENABLE_HTTPS == 1
	#include <ssl_client.h>
	#include <WiFiClientSecure.h>

	WiFiClientSecure client;
#else
	#include <WiFi.h>

	WiFiClient client;
#endif

#include "accelerometer.h"
#include "timelog.h"


#ifdef SERIAL_DEBUG
	#define SDBG(MSG) Serial.print(MSG)
	#define SDBGF(MSG, ...) Serial.printf(MSG, __VA_ARGS__)
	#define SDBGLN(MSG) Serial.print(MSG "\r\n")
#else
	#define SDBG(MSG)
	#define SDBGF(MSG, ...)
	#define SDBGLN(MSG)
#endif


static void        resetSystem();
static void        gotoDeepSleep(unsigned long long wakeupTime, bool force = false);
static bool        syncData();
static bool        uploadData();
static bool        updateTime();
static bool        wlanConnect();
static void        wlanSetup();
static bool        checkSide(bool forceNewEntry = false);
static uint8_t     getStableSide();
static uint8_t     getSide();
static uint8_t     getBattery();
static const char* formatTime(const time_t ts);

const uint8_t side_translate[6] = SIDE_MAPPING;

RTC_DATA_ATTR uint16_t timelog_entry = 0;
RTC_DATA_ATTR tle      timelog[TIMELOG_MAX];
RTC_DATA_ATTR time_t wakeup = SYNC_INTERVAL;

RTC_DATA_ATTR unsigned deep_sleep = 0;
RTC_DATA_ATTR unsigned sync_counter = 0;
RTC_DATA_ATTR unsigned bug_counter = 0;

RTC_DATA_ATTR bool wifi_active = false;

static Accelerometer accel = Accelerometer(ACCEL_CS_PIN);
static hw_timer_t *timer = nullptr;


void setup() {
	#ifdef SERIAL_DEBUG
	// Initialize Serial connection for debug output
	Serial.begin(SERIAL_DEBUG);
	#endif

	// Wait 10 ms
	delay(10);

	SDBGF("Starting Watchdog (Bug Counter: %d)...\r\n", bug_counter);
	#define DEINIT_TIMEOUT (60 * 1000 * 1000)
	timer = timerBegin(0, 80, true);
	timerAttachInterrupt(timer, &resetSystem, true);
	timerAlarmWrite(timer, DEINIT_TIMEOUT, false);
	timerAlarmEnable(timer);

	// disable unused components on first start
	if(0 == deep_sleep) {
		SDBGLN("Powering down BT and ADC...");
		//esp_bt_controller_disable();
		adc_power_off();
	}

	#if ENABLE_HTTPS == 1
		client.setCACert(ROOT_CERTIFICATE);
	#endif
	client.setTimeout(1500);

	// Light blue LED (on FireBeetle)
	pinMode(STATUS_LED_PIN, OUTPUT);
	digitalWrite(STATUS_LED_PIN, HIGH);

	// print current timestamp to serial (debugging)
	{
		time_t now;
		time(&now);
		SDBGF("Wakeup at %s\r\n", formatTime(now));
	}

	// Set up Accelerometer
	if(!accel.begin()) {
		SDBGLN("Beschleunigungssensor antwortet nicht.");
	} else {
		accel.setClickInterrupt(3, ACCEL_CLICK_THS);
		accel.setMovementInterrupt();
	}

	// Get Wakeup source
	esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
	SDBG("Wakeup reason: ");
	switch(wakeup_reason) {
		// Valid
		case 0: SDBGLN("Reboot"); break;
		case ESP_SLEEP_WAKEUP_EXT0:  SDBGLN("EXT0");  break;
		case ESP_SLEEP_WAKEUP_TIMER: SDBGLN("Timer"); break;

		// Invalid
		case ESP_SLEEP_WAKEUP_EXT1:     SDBGLN("EXT1 (should not happen)");        break;
		case ESP_SLEEP_WAKEUP_TOUCHPAD: SDBGLN("Touchpad (should not happen)");    break;
		case ESP_SLEEP_WAKEUP_ULP:      SDBGLN("ULP (should not happen)");         break;
		default : SDBGF("Unknown reason %d (should not happen)\r\n", wakeup_reason); break;
	}

	// Do we need an WLAN synchronization?
	bool update = (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) || (wakeup_reason == ESP_SLEEP_WAKEUP_UNDEFINED) || (timelog_entry > TIMELOG_MAX);

	// check tap
	uint8_t click = accel.getClick();
	if(click != 0 && (click & 0x30)) {
		SDBGLN("Sync reason: Click");
		update = true;
	}

	// Timer wakeup
	time_t now;
	time(&now);
	if(now >= wakeup) {
		update = true;
	}

	// check side
	checkSide(update);

	// do update
	if(update) {
		 SDBGF("Sync #%d\r\n", ++sync_counter);
		 syncData();

		 // New Timer Wakeup
		 time(&now);
		 wakeup = now + SYNC_INTERVAL;

		 // safety - if wlan connection was slow, lets check current side again, maybe it has been flipped meanwhile
		 checkSide();
	}

	// calculate next wakeup
	if(wakeup - now < 1) {
		wakeup = now + 1;
	}
	gotoDeepSleep((wakeup - now) * 1000000ULL);
}



/*
 * BATTERY-related functions
 */
const uint8_t UNKNOWN_BATTERY = 0xFF;
static uint8_t getBattery() {
	static uint8_t battery = UNKNOWN_BATTERY;

	if(UNKNOWN_BATTERY == battery) {
		SDBGLN("Reading Battery State via ADC:");

		SDBGLN(" * Characterizing ADC...");
		esp_adc_cal_characteristics_t adc_chars = {};

		switch(esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, DEFAULT_VREF, &adc_chars)) {
			case ESP_ADC_CAL_VAL_EFUSE_VREF: SDBGLN("  -> via eFuse VRef"); break;
			case ESP_ADC_CAL_VAL_EFUSE_TP:   SDBGLN("  -> via eFuse TP");   break;
			default: SDBGLN("  -> via default value :/");
		}

		SDBGLN(" * Starting ADC...");
		adc_power_on();
		adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_11);
		adc1_config_width(ADC_WIDTH_BIT_12);

		SDBGLN(" * Read from ADC...");
		int rawval = adc1_get_raw(ADC1_CHANNEL_0);

		SDBGLN(" * Stopping ADC...");
		adc_power_off();

		// Battery voltage is 2x the voltage measured here
		// due to an on-board voltage divider used for measurement
		uint32_t voltage = 2 * esp_adc_cal_raw_to_voltage(rawval, &adc_chars);
		SDBGF("  Battery Voltage: %dmV\r\n", voltage);


		if(voltage > BATTERY_MAX) {
			battery = 100;
		} else if(voltage < BATTERY_MIN) {
			battery = 0;
		} else {
			battery = (voltage - BATTERY_MIN) * 100 / (BATTERY_MAX - BATTERY_MIN);
		}
		SDBGF(" * Battery State from ADC: %d%%\r\n", battery);
	} else {
		SDBGF("Using Battery State from Previous Call: %d%%\r\n", battery);
	}

	return battery;
}


/*
 * ACCELEROMETER-related functions
 */
static uint8_t getSide() {
	uint8_t state = accel.getMovement();
	for (uint8_t p = 0; p < 6; p++) {
		if((state & 0x3f) == (1 << p))
			return side_translate[p];
	}
	return 0;
}

static uint8_t getStableSide() {
	// Get current side
	uint8_t side_last = getSide();
	// try to save power during sleep
	esp_sleep_enable_timer_wakeup(SIDE_DELAY * 1000);
	// we need SIDE_COUNT stable reads
	for (uint8_t n = 0 ; n < SIDE_COUNT ; n++) {
		// try light sleep, fall back to delay
		if(esp_light_sleep_start() != ESP_OK) {
			SDBGLN("delay");
			delay(SIDE_DELAY);
		}
		// Update Side
		uint8_t side = getSide();
		// check if stable or reset
		if(side_last != side) {
			side_last = side;
			n = 0;
		}
	}
	return side_last;
}


/*! \brief Check active side (and create entry in timelog if changed)
 *  \param forceNewEntry create a new entry in timelog even if the side hasn't changed
 *  \return true if a new entry was created
 */
static bool checkSide(bool forceNewEntry) {
	uint8_t side = getStableSide();
	if(timelog_entry < TIMELOG_MAX && (forceNewEntry || timelog_entry == 0 || side != (timelog[timelog_entry - 1].get_side()))) {
		tle timestamp;
		timestamp.set_time_to_now();
		timestamp.set_side(side);

		timelog[timelog_entry++] = timestamp;
		SDBGF("Currently active side: %d\r\n", side);
		return true;
	}
	return false;
}


/*! \brief Connect to WLAN using given credentials
 */
static void wlanSetup() {
	// Disconnect previous WLAN session (although there shouldn't be any)
	WiFi.disconnect(true);

	SDBG("Connecting to WLAN " WLAN_SSID);
	WiFi.mode(WIFI_STA);

#ifdef WLAN_IDENTITY
	SDBGLN(" using EAP");
	// Use EAP
	esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)WLAN_ANONYMOUS_IDENTITY, strlen(WLAN_ANONYMOUS_IDENTITY));
	esp_wifi_sta_wpa2_ent_set_username((uint8_t *)WLAN_IDENTITY, strlen(WLAN_IDENTITY));
	esp_wifi_sta_wpa2_ent_set_password((uint8_t *)WLAN_PASSWORD, strlen(WLAN_PASSWORD));
	esp_wpa2_config_t wlan_config = WPA2_CONFIG_INIT_DEFAULT();
	esp_wifi_sta_wpa2_ent_enable(&wlan_config);
	WiFi.begin(WLAN_SSID);
#else
	SDBGLN();
	// Simple connection
	WiFi.begin(WLAN_SSID, WLAN_PASSWORD);
#endif

	wifi_active = true;
}


/*
 * NETWORK-related functions
 */

/*! \brief Wait for WLAN connection
 *  \return true on success, false if timed out
 */
static bool wlanConnect() {
	int stat, prev = 0;
	for (int c = 0; (stat = WiFi.status()) != WL_CONNECTED ; c++) {
		delay(WLAN_RECONNECT_DELAY);
		if(stat != prev) {
			prev = stat;
			switch (stat) {
				case WL_NO_SHIELD:       SDBG("[no WLAN Shield]");       break;
				case WL_IDLE_STATUS:     SDBG("[WLAN Idle]");            break;
				case WL_NO_SSID_AVAIL:   SDBG("[no WLAN SSID]");         break;
				case WL_SCAN_COMPLETED:  SDBG("[WLAN scan completed]");  break;
				case WL_CONNECT_FAILED:  SDBG("[WLAN connect failed]");  break;
				case WL_CONNECTION_LOST: SDBG("[WLAN connection lost]"); break;
				case WL_DISCONNECTED:    SDBG("[WLAN disconnected]");    break;
				default: SDBG("[WLAN status unknown]");
			}
		}
		SDBG(".");
		if(c >= WLAN_RECONNECT_TRIES) {
			SDBGLN("[WLAN connection FAILED]");
			return false;
		}
	}
	return true;
}

/*! \brief Update RTC using NTP
 * \return false if no WLAN connection available
 */
static bool updateTime() {
	time_t old_ts;
	time(&old_ts);

	if(!wlanConnect()) {
		return false;
	}

	configTime(0, 0, SYNC_NTP1, SYNC_NTP2, SYNC_NTP3);
	delay(300);

	time_t new_ts;
	time(&new_ts);

	// check if we have an initial update
	if(old_ts < RTC_TIMESTAMP_THS && new_ts > RTC_TIMESTAMP_THS) {

		// Update entries
		uint32_t delta = new_ts - old_ts;

		SDBGF("Updating timelog entries with new time (delta: %ds)\r\n", delta);
		for (int i = 0; i < timelog_entry; i++) {
			timelog[i].set_time(timelog[i].get_time() + delta);
		}
	}

	return true;
}

static bool uploadData() {
	if(wlanConnect()) {
		uint64_t mac = ESP.getEfuseMac();
		uint8_t battery = getBattery();
		time_t now;
		time(&now);

		// Debug status
		const size_t content_length = (timelog_entry == 0) ? 15 : (17 + timelog_entry * 9);
		#ifdef SERIAL_DEBUG
		{
			SDBGF("Trying to send %d timelog entries (Content-Length: %d Bytes) to " SYNC_HOST "\r\n", timelog_entry, content_length);
			SDBGF(" MAC: %04X%08X\r\n",(uint16_t)(mac>>32), (uint32_t)mac);
			SDBGF(" Battery: %d%%\r\n", battery);
			SDBGF(" Current Time: %s (UNIX Timestamp: %ld)\r\n", formatTime(now), now);
			SDBGLN(" Data:");
			for (int i = 0; i < timelog_entry; i++) {
				SDBGF("  [%d] Side %d at %s (UNIX Timestamp: %ld)\r\n", i, timelog[i].get_side(), formatTime(timelog[i].get_time()), timelog[i].get_time());
			}
		}
		#endif

		if(client.connect(SYNC_HOST, SYNC_PORT)) {
			client.printf("POST " SYNC_CONTEXT "%04X%08X/upload HTTP/1.1\r\n", (uint16_t)(mac>>32), (uint32_t)mac);
			client.print ("Host: " SYNC_HOST "\r\n");
			client.print ("User-Agent: i4timecube\r\n");
			client.print ("Content-Type: application/x-www-form-urlencoded\r\n");
			client.printf("Content-Length: %d\r\n\r\n", content_length);

			client.printf("v=%02X&t=%08lX", battery, now);
			if(timelog_entry > 0) {
				client.printf("&d=%08lX", static_cast<unsigned long>(timelog[0]));
				for (int i = 1; i < timelog_entry; i++) {
					client.printf("+%08lX", static_cast<unsigned long>(timelog[i]));
				}
			}

			SDBGLN(" Response from " SYNC_HOST ":");
			for (int t = 0; t<20 && client.connected();t++) {
				String line = client.readStringUntil('\n');
				SDBGF("  [line %d] %s\r\n", t, line.c_str());
				if(line == "HTTP/1.1 200 OK\r" || line == "HTTP/1.0 200 OK\r") {
					return true;
				}
				if(line == "\r") {
					break;
				}
			}
		} else {
			SDBGLN("Connection failed");
			return false;
		}
	}
	return false;
}

static bool syncData() {
	wlanSetup();

	if(!wlanConnect()) {
		return false;
	}

	SDBGF("IP: %s\r\n", WiFi.localIP().toString().c_str());
	delay(WLAN_RECONNECT_DELAY);

	bool ret = true;
	if(!updateTime()) {
		ret = false;
		SDBGLN("NTP failed");
	}

	if(uploadData()) {
		// Reset entries
		timelog[0] = timelog[timelog_entry - 1];
		timelog_entry = 1;
		SDBGLN("HTTP upload successful");
	} else {
		ret = false;
		SDBGLN("HTTP upload FAILED");
	}

	WiFi.disconnect(true);

	return ret;
}

static void gotoDeepSleep(unsigned long long wakeupTime, bool force) {
	SDBGF("Preparing for Sleep #%d:\r\n", ++deep_sleep);

	if(wifi_active && !force) {
		SDBGLN(" * Powering down WiFi...");
		esp_wifi_stop();
		wifi_active = false;
	}

	esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_ON);
	rtc_gpio_isolate(ACCEL_INT_PIN);

	esp_sleep_enable_ext0_wakeup(ACCEL_INT_PIN, 1);
	esp_sleep_enable_timer_wakeup(wakeupTime);

	SDBGLN(" * Stopping Watchdog...");
	timerAlarmDisable(timer);
	timerEnd(timer);

	SDBGLN(" * Entering deep sleep...");
#ifdef SERIAL_DEBUG
	Serial.flush();
#endif
	esp_deep_sleep_start();
}


static void resetSystem() {
	++bug_counter;

	SDBGLN("-=================-");
	SDBGLN("|~~~    BUG    ~~~|");
	SDBGLN("-=================-");

	SDBGF("[BUG %d] Watchdog triggered; Resetting System\r\n", bug_counter);
#ifdef SERIAL_DEBUG
	Serial.flush();
#endif
	gotoDeepSleep(5 * 1000ULL * 1000ULL, /* force = */ true);
}

static const char* formatTime(const time_t ts) {
        static char buf[64];
        struct tm *lt = localtime(&ts);
        strftime(buf, sizeof(buf), "%d.%m.%Y %H:%M:%S", lt);
        return buf;
}

void loop() { /* This is never going to be called due to deep sleep. */ }
