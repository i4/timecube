Installation der Firmware
-------------------------

### Voraussetzungen

Folgende Komponenten werden benötigt:

  * [xtensa-esp32-Toolchain](https://docs.espressif.com/projects/esp-idf/en/release-v3.3/get-started/linux-setup.html)
  * [ESP IDF *in Version 3.3*](https://github.com/espressif/esp-idf) (die verwendeten Arduino-Erweiterungen kommen aktuell mit neuen Versionen nicht zurecht)


### Vorbereitung

Auf einem debianoiden Linux mit aktueller Version können die benötigten Komponenten wie folgt installiert werden:

    # Dieses Repo für Firmware rekursiv auschecken
    git clone https://gitlab.cs.fau.de/heinloth/timecube.git
    cd timecube
    git submodule update --init --recursive
    # Benötigte Pakete installeiren
    sudo apt-get install make git wget libncurses-dev flex bison gperf python python-pip python-setuptools python-serial python-click python-cryptography python-future python-pyparsing python-pyelftools cmake ninja-build ccache
    # ESP IDF Version 3.3 rekursiv auschecken
    git clone --depth=1 --recursive --branch v3.3 https://github.com/espressif/esp-idf.git
    export IDF_PATH="$(readlink -f esp-idf)"
    # xtensa-esp32-Toolchain laden (URL von der linux-setup Webseite)
    wget -qO- https://dl.espressif.com/dl/xtensa-esp32-elf-linux64-1.22.0-80-g6c4433a-5.2.0.tar.gz | tar xvz
    export PATH="$PATH:$(readlink -f xtensa-esp32-elf/bin)"


### Bauen der Firmware

Nach der Vorbereitung im `timecube`-Verzeichnis folgende Schritte ausführen:

    mkdir build
    cd build
    cmake ..
    make


### Flashen des Würfels

Mittels `make flash` kann die Software dann auf den Würfel geflasht werden.
Hat man mehr als einen ESP32 angeschlossen, dann kann/muss man mittel Umgebungsvariable `ESPPORT` angeben, welcher Chip geflasht werden soll:
`ESPPORT=/dev/ttyUSB5 make flash`

