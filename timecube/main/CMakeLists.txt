set(COMPONENT_REQUIRES arduino esp_adc_cal)

set(COMPONENT_SRCS "accelerometer.cpp timecube.cpp")
set(COMPONENT_ADD_INCLUDEDIRS ".")

register_component()
