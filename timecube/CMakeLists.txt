cmake_minimum_required(VERSION 3.5)

add_definitions("-DARDUINO=10800")
add_definitions("-DARDUINO_ARCH_ESP32")
add_definitions("-DCONFIG_ARDUHAL_ESP_LOG")

include($ENV{IDF_PATH}/tools/cmake/project.cmake)

project(timecube)
