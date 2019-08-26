TTY=$(shell ls -1 /dev/ttyUSB* | rev | sort -rn | rev | head -n1)

#
# Folder Configuration
#
ARDU_BASE=${HOME}/Arduino/
ESP32_BASE=${HOME}/.arduino15/packages/esp32/
FB_BASE=${ESP32_BASE}/hardware/DFRobot_FireBeetle-ESP32/0.0.9/

#
# Tool Configuration
#
CC=${ESP32_BASE}/tools/xtensa-esp32-elf-gcc/1.22.0-61-gab8375a-5.2.0/bin/xtensa-esp32-elf-gcc
CXX=${ESP32_BASE}/tools/xtensa-esp32-elf-gcc/1.22.0-61-gab8375a-5.2.0/bin/xtensa-esp32-elf-g++
ESPPART=python ${FB_BASE}/tools/gen_esp32part.py
ESPTOOL=python ${FB_BASE}/tools/esptool.py


#
# (System) Include Configuration
#
ESP32_INCL_BASE=${FB_BASE}/tools/sdk/include/
ESP32_INCL_FILES=$(wildcard ${ESP32_INCL_BASE}/*) ${FB_BASE}/cores/esp32 ${FB_BASE}/variants/firebeetle32 ${FB_BASE}/libraries/SPI/src ${FB_BASE}/libraries/WiFi/src
ESP32_INCL=$(ESP32_INCL_FILES:%=-isystem%)


#
# Compiler Flag Configuration
#
CCXXFLAGS =-Os -g3 -flto -Wall -pedantic -Wextra -Wpointer-arith
CCXXFLAGS+=-nostdlib -ffunction-sections -fdata-sections -fstrict-volatile-bitfields -mlongcalls
CCXXFLAGS+=-DESP_PLATFORM -DMBEDTLS_CONFIG_FILE=\"mbedtls/esp_config.h\" -DHAVE_CONFIG_H
CCXXFLAGS+=-DF_CPU=120000000L -DARDUINO=10809 -DARDUINO_ESP32_DEV -DARDUINO_BOARD=\"ESP32_DEV\" -DARDUINO_VARIANT=\"firebeetle32\" -DESP32 -DCORE_DEBUG_LEVEL=0
# CCXXFLAGS+=-DARDUINO_ARCH_DFROBOT_FIREBEETLE-ESP32 # invalid define emitted by arduino; omitted here
CCXXFLAGS+=${ESP32_INCL}

CFLAGS=${CCXXFLAGS} -std=gnu11
CXXFLAGS=${CCXXFLAGS} -std=gnu++11 -fno-rtti


#
# find source files for core files and libraries
#
SRC_CORE=$(shell find ${FB_BASE}/cores/esp32/ -type f)
SRC_FB=  $(shell find ${FB_BASE}/variants/firebeetle32/ -type f)
SRC_SPI= $(shell find ${FB_BASE}/libraries/SPI/src/ -type f)
SRC_WIFI=$(shell find ${FB_BASE}/libraries/WiFi/src/ -type f)

SRC_CORE_C=$(filter %.c,${SRC_CORE})
SRC_FB_C=  $(filter %.c,${SRC_FB})
SRC_SPI_C= $(filter %.c,${SRC_SPI})
SRC_WIFI_C=$(filter %.c,${SRC_WIFI})

SRC_CORE_CXX=$(filter %.cpp,${SRC_CORE})
SRC_FB_CXX=  $(filter %.cpp,${SRC_FB})
SRC_SPI_CXX= $(filter %.cpp,${SRC_SPI})
SRC_WIFI_CXX=$(filter %.cpp,${SRC_WIFI})

OBJ_CORE=$(SRC_CORE_C:%.c=%.o) $(SRC_CORE_CXX:%.cpp=%.o)
OBJ_FB=  $(SRC_FB_C:%.c=%.o)   $(SRC_FB_CXX:%.cpp=%.o)
OBJ_SPI= $(SRC_SPI_C:%.c=%.o)  $(SRC_SPI_CXX:%.cpp=%.o)
OBJ_WIFI=$(SRC_WIFI_C:%.c=%.o) $(SRC_WIFI_CXX:%.cpp=%.o)

ALL_OBJ=${OBJ_CORE} ${OBJ_FB} ${OBJ_SPI} ${OBJ_WIFI}


#
# Precompiled libs to link against (default: all)
#
LIBS=gcc openssl btdm_app fatfs wps coexist wear_levelling hal newlib driver bootloader_support pp mesh smartconfig jsmn wpa ethernet phy app_trace console ulp wpa_supplicant freertos bt micro-ecc cxx xtensa-debug-module mdns vfs soc core sdmmc coap tcpip_adapter c_nano rtc spi_flash wpa2 esp32 app_update nghttp spiffs espnow nvs_flash esp_adc_cal log expat m c heap mbedtls lwip net80211 pthread json stdc++

#
# Linker scripts to use
#
LSCRIPTS=esp32_out.ld esp32.common.ld esp32.rom.ld esp32.peripherals.ld esp32.rom.spiram_incompatible_fns.ld

#
# Rules
#

all: sketch_timecube.bin

sketch_timecube.elf: sketch_timecube.o accelerometer.o ${ALL_OBJ}
	@echo LD $@
	@$(CC) -nostdlib -flto -L${FB_BASE}/tools/sdk/lib -L${FB_BASE}/tools/sdk/ld $(LSCRIPTS:%=-T %) \
		-Wl,--gc-sections -Wl,-static -Wl,--undefined=uxTopUsedPriority -u ld_include_panic_highint_hdl -u call_user_start_cpu0 -u __cxa_guard_dummy -u __cxx_fatal_exception \
		-Wl,--start-group $^ $(LIBS:%=-l%) -Wl,--end-group -Wl,-EL -o $@

%.o: %.cpp
	@echo CXX $<
	@$(CXX) $(CXXFLAGS) -c $< -o $@

%.o: %.c
	@echo CC $<
	@$(CC) $(CFLAGS) -c $< -o $@

partitions.bin: ${FB_BASE}/tools/partitions/no_ota.csv
	${ESPPART} --disable-md5sum -q ${FB_BASE}/tools/partitions/no_ota.csv partitions.bin

%.bin: %.elf
	${ESPTOOL} --chip esp32 elf2image --flash_mode dio --flash_freq 80m --flash_size 4MB -o $@ $<

flash: sketch_timecube.bin partitions.bin ${FB_BASE}/tools/sdk/bin/bootloader.bin ${FB_BASE}/tools/partitions/boot_app0.bin
	@echo FLASH $< to ${TTY}
	@${ESPTOOL} --chip esp32 --port ${TTY} --baud 460800 --before default_reset --after hard_reset write_flash -z --flash_freq 80m --flash_mode dio --flash_size 4MB 0x1000 ${FB_BASE}/tools/sdk/bin/bootloader.bin 0x8000 partitions.bin 0xe000 ${FB_BASE}/tools/partitions/boot_app0.bin 0x10000 sketch_timecube.bin

print-%:
	@echo $* = $($*)
