Zeiterfassungswürfel
====================

Ein kleiner und unauffälliger Würfel (mit etwa 6cm Kantenlänge) für den Schreibtisch.
Jede Seite entspricht einer zu erfassenden Tätigkeit reserviert, beispielsweise:

  * Feierabend
  * Kaffeepause
  * Forschung
  * Lehre
  * Besprechung
  * Sonstiges

Durch das Erkennen von Drehbewegungen und entsprechenden Speichern von Zeitstempel sowie Lage kann die Zeit bequem erfasst werden.
Diese wird regelmäßig an ein Endgerät mit Bildschirm (Computer/Smartphone) übertragen und visualisiert.

Im Gegensatz zu einer reinen PC-Zeitferfassungsanwendung ist man bei dem Würfel unabhängiger vom aktuellen Systemzustand des Arbeitsgeräts (PC aus, anderes Betriebssystem gebootet, ...), mit intuitiver Bedienung und sofort deutlich sichtbaren Zustand (ohne die Notwendigkeit den Fensterverwalter entsprechend einzurichten).

Die Zeiterfassung soll dabei helfen das Verhältnis der verschiedenen Tätigkeiten besser zu überblicken (Lehre - Forschung). Es ist nicht Ziel eine exakte hochdetaillierte Erfassung zu erhalten.

![Würfel Vorschau](images/cubes.jpg)


Anleitung
---------

  * [Detaillierte und bebilderte Montageanleitung](MONTAGE.md)
  * [Anleitung zum Bauen der Firmware für den Würfel](INSTALL.md)


Lizenz
------

Der Zeitwürfel ist Freie Software: Sie können es unter den Bedingungen
der GNU Affero General Public License, wie von der Free Software Foundation,
Version 3 der Lizenz, weiter verteilen und/oder modifizieren.

Der Zeitwürfel wird in der Hoffnung, dass es nützlich sein wird, aber
OHNE JEDE GEWÄHRLEISTUNG, bereitgestellt; sogar ohne die implizite
Gewährleistung der MARKTFÄHIGKEIT oder EIGNUNG FÜR EINEN BESTIMMTEN ZWECK.
Siehe die [GNU Affero General Public License](LICENSE) für weitere Details.

Sie sollten eine Kopie der GNU Affero General Public License zusammen mit diesem
Programm erhalten haben. Wenn nicht, siehe https://www.gnu.org/licenses/ .


Grundüberlegungen
-----------------

  * Die Lage kann mit einem 3-Achsen-Beschleunigungssensor ausgemessen werden (durch die Erdbeschleunigung kann ein in Ruhe auf dem Tisch liegender Würfel sehr einfach die Oberseite erkennen). Weitere Sensoren sind nicht notwendig (Kosten nur Strom und Geld).
  * Der Würfel sollte kabellos sein
    * Übertragung sollte über WLan (und später eventuell auch Bluetooth) erfolgen.
    * Batterie für die Stromversorgung
    * Wiederaufladbar, z.B. über USB (oder Induktion?)
    * Dennoch: Möglichst niedriger Energiebedarf
  * Daten werden über eine Weboberfläche visualisiert
    * HTTP bietet sich auch als Protokoll für die Kommunikation zwischen Würfel und Uploadserver an
  * 6 Seiten (Würfel) sollten i.d.R. reichen, alternativ sollten aber auch 8 (Oktaeder) oder 12 (Dodekaeder) möglich sein


Prototyp
--------

Batteriebetriebener [ESP32](https://www.espressif.com/en/products/hardware/esp32/overview) ([Adafruit HUZZAH32](https://learn.adafruit.com/adafruit-huzzah32-esp32-feather/overview)) mit Beschleunigungssensor [LIS3DH](https://www.st.com/resource/en/datasheet/cd00274221.pdf) (von [Adafruit](https://learn.adafruit.com/adafruit-lis3dh-triple-axis-accelerometer-breakout/arduino)) und einer *1000 mAh* [LiPoly](https://de.wikipedia.org/wiki/Lithium-Polymer-Akkumulator) in einem im Fablab gelaserten Holzwürfel (Kostenpunkt: alles zusammen etwa 30 Euro).

### Entwicklung

  * Programmierung über [Arduino IDE](https://www.arduino.cc/)
    * Mit [ESP32 Erweiterung](https://github.com/espressif/arduino-esp32)
  * *LIS3DH* über SPI mit *ESP32* verbunden
    * Interruptpin des Beschleunigungssensors ebenfalls mit Mikrocontroller GPIO Pin verbunden
  * Bei Bedarf WLan-Verbindung herstellen
    * Verwendung von *eduroam*
    * RTC synchronisiert bei jeder Verbindung mit NTP
    * Daten werden regelmäßig (alle 4h) sowie nach Bedarf (Speicher zu 50% voll oder manuell durch zweifaches Klopfen auf den Würfel) an Server **i4time** übertragen
  * Tiefschlaf solange keine Änderung

### Erkenntnisse

  * Die Drehung sollte erst nach ein paar Sekunden ohne Änderung geloggt werden.
    * Es kommt sicher hin und wieder jemand ins Büro der den Würfel ungefragt/begeistert in die Hand nimmt und sich von allen Seiten anschaut. 
    * Eine sekundengenaue Erfassung ist eh nicht nötig.
  * Die Interruptkonfiguration für den Beschleunigungssensor ist nicht so frei wie erwartet.
    * Nach mehrfachen probieren wird die 6D-Bewegungs- und Klickerkennung verwendet, die bei korrekt platzierten Sensor sehr gut funktioniert (und Berechnungen erspart).
    * Für andere Körper muss hier mehr Hirnarbeit reingesteckt werden, sollte jedoch prinzipiell auch möglich sein.
  * Der *ESP32* hat eine Echtzeituhr (RTC), die unkompliziert zur Zeitmessung und dem Wecken verwendet werden kann.
    * Der 8kb RTC Ram bleibt (im Gegensatz zum normalen Ram) auch über den Tiefschlaf (Deep Sleep) hinweg persistent -- eignet sich also sehr gut als Speicher für Zeiten
  * Das verwendete Board verbraucht aufgrund des USB-Serial-Chip selbst im Tiefschlaf 6mA (der ESP32 selbst unter 10μA)
    * Laufzeit unter einer Woche (ohne laden)...


Revision 1
----------

Wechsel auf [Firebeetle ESP32](https://www.dfrobot.com/product-1590.html) mit theoretisch 10μA Verbrauch im Tiefschlaf. In der Praxis ist der Gesamtverbrauch im Tiefschlaf <60μA.
