Bauen und Flashen der Würfelsoftware
====================================

Voraussetzungen
---------------

Auf dem Rechner müssen folgende Komponenten installiert sein:

 * xtensa-esp32-Toolchain, siehe https://docs.espressif.com/projects/esp-idf/en/latest/get-started/linux-setup.html
 * das ESP IDF *in Version 3.3* (die verwendeten Arduino-Erweiterungen kommen aktuell mit neuen Versionen nicht zurecht): https://github.com/espressif/esp-idf


Bauen der Software
------------------

```
mkdir build
cd build
cmake ..
make
make flash
```

Flashen des Würfels
-------------------

Mittels `make flash` kann die Software dann auf den Würfel geflasht werden.
Hat man mehr als einen ESP32 angeschlossen, dann kann/muss man mittel Umgebungsvariable `ESPPORT` angeben, welcher Chip geflasht werden soll:
`ESPPORT=/dev/ttyUSB5 make flash`

