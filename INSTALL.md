Installation der Firmware
=========================

Die Firmware des Zeitwürfels kann entweder über *Arduino IDE* oder *ESP IDF* übersetzt und übertragen werden.


Arduino IDE
-----------

*Arduino* erlaubt einen schnellen Einstieg, allerdings sind erweiterte (stromsparendere) Konfigurationsmöglichkeiten hier nicht möglich.

### Vorbereitung

  1. Aktuelle [Arduino IDE](https://www.arduino.cc/en/main/software) installieren
  2. Unter Windows den (unsignierten) [FireBeetle ESP32 Treiber](https://git.oschina.net/dfrobot/FireBeetle-ESP32/raw/master/FireBeetle-ESP32.inf) installieren.
  3. Arduino Umgebung für den FireBeetle ESP32 gemäß [DFRobot Wiki](https://wiki.dfrobot.com/FireBeetle_ESP32_IOT_Microcontroller(V3.0)__Supports_Wi-Fi_&_Bluetooth__SKU__DFR0478) hinzufügen:
     * Unter *Datei* / *Voreinstellungen* als *Zusätzliche Boardverwalter-URLs* die Adresse `http://download.dfrobot.top/FireBeetle/package_esp32_index.json` eingeben und mittels *OK* bestätigen
     * Unter *Werkzeuge* / *Board: ...* den *Boardverwalter...* öffnen, das automatische Update abwarten und dann den *FireBeetle-ESP32-Mainboard by DFRobot DFRDuino* in einer aktuellen Version (0.0.9) installieren


### Verwendung

  1. Die Arduino IDE starten und `firmware/sketch_timecube/sketch_timecube.ino` öffnen -- weitere Tabs mit den restlichen Dateien werden ebenfalls geladen
  2. Unter *Werkzeuge* / *Board: ...* den *FireBeetle-ESP32* auswählen
  3. Die Datei `config.h` anpassen, ggf. weitere Änderungen vornehmen
  4. Mit *Überprüfen/Kompilieren* unter *Sketch* die getätigten Änderungen prüfen.
  5. Den Zeitwürfel per USB mit dem PC verbinden und unter *Werkzeuge* / *Port* entsprechend auswählen (z.B. `/dev/ttyUSB0`)
  6. Ebenfalls unter *Werkzeuge* den *Uploadspeed* auf `115200` stellen und ebenda *Serieller Monitor* starten
  7. Unter *Sketch* / *Hochladen* das Übertragen der Firmware starten. Und warten.
  8. Auf dem seriellen Monitor erscheint eine Ausgabe nach erfolgreichem Start.


ESP IDF
-------

Das *Espressif IoT Development Framework* ist das offizielle Entwicklungsframework für den ESP32 und erlaubt (durch die Datei `sdkconfig`) eine erweiterte Konfiguration des zugrunde liegenden [FreeRTOS](https://www.freertos.org/)-Kernels, wie z.B. eine niedrigere Taktfrequenz.

### Voraussetzungen

Folgende Komponenten werden benötigt:

  * [xtensa-esp32-Toolchain](https://docs.espressif.com/projects/esp-idf/en/release-v3.3/get-started/linux-setup.html)
  * [ESP IDF *in Version 3.3*](https://github.com/espressif/esp-idf) (die verwendeten Arduino-Erweiterungen kommen aktuell mit neuen Versionen nicht zurecht)


### Vorbereitung

Die Konfiguration in der Datei `firmware/main/config.h` muss angepasst werden.

Auf einem debianoiden Linux mit aktueller Version können die benötigten Komponenten wie folgt installiert werden:

    # Dieses Repo für Firmware rekursiv auschecken
    git clone https://gitlab.cs.fau.de/i4/timecube.git
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

Nach der Vorbereitung im `firmware`-Verzeichnis folgende Schritte ausführen:

    mkdir build
    cd build
    cmake ..
    make


### Flashen des Zeitwürfels

Mittels `make flash` kann die Firmware dann auf den via USB verbundenen Würfel übertragen werden.
Hat man mehr als einen ESP32 angeschlossen, dann kann/muss man mittel Umgebungsvariable `ESPPORT` angeben, welcher Chip geflasht werden soll:
`ESPPORT=/dev/ttyUSB5 make flash`

