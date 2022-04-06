FROM debian:stable

ENV DEBIAN_FRONTEND noninteractive

LABEL org.label-schema.schema-version="1.0"
LABEL org.label-schema.name="timecube"
LABEL org.label-schema.description="Environment for i4 timecube"
LABEL org.label-schema.url="https://sys.cs.fau.de/"
LABEL org.label-schema.vcs-url="https://gitlab.cs.fau.de/i4/timecube"
LABEL org.label-schema.vendor="Friedrich-Alexander-Universität Erlangen-Nürnberg / Lehrstuhl für Informatik 4"

ENV IDF_PATH="/timecube/firmware/esp-idf/"
ENV PATH="${PATH}:/timecube/firmware/xtensa-esp32-elf/bin"

RUN ln -fs /usr/share/zoneinfo/Europe/Berlin /etc/localtime \
 && export DEBIAN_FRONTEND=noninteractive \
 && apt-get update -qq \
 && apt-get install -y -qq eatmydata \
 && eatmydata apt-get install -y -qq make cmake git wget flex bison gperf python3 python3-pip python3-setuptools python-is-python3 libffi-dev libssl-dev nginx php php-fpm php-pgsql \
 && git clone --recursive https://gitlab.cs.fau.de/i4/timecube.git /timecube \
 && git clone --depth=1 --recursive --branch v3.3.6 https://github.com/espressif/esp-idf.git /timecube/firmware/esp-idf \
 && pip3 install -r /timecube/firmware/esp-idf/requirements.txt \
 && sed -i '/^#include <protocomm_ble.h>$/d' /timecube/firmware/esp-idf/components/wifi_provisioning/include/wifi_provisioning/scheme_ble.h \
 && wget -qO- https://dl.espressif.com/dl/xtensa-esp32-elf-linux64-1.22.0-97-gc752ad5-5.2.0.tar.gz | tar xvz -C /timecube/firmware \
 && mkdir -p /timecube/firmware/build

WORKDIR /timecube/firmware/build

CMD ["/bin/sh", "-c" , "cmake .. && make && make flash"]
