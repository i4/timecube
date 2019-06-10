Montageanleitung
-----------------

![Würfel Vorschau](images/cubes.jpg)

### Gehäuse

Der Würfel kann je nach Belieben aus Acryl oder Holz angefertig werden.
Es gibt Vorlagen für den Lasercutter für 3mm und 4mm Materialdicke.

### Vorbereitung Firebeetle und LIS3DH

  * Beim *LIS3DH* einen Widerstand herauslöten, da dieser unnötig Strom verbraucht.

![LIS3DH Vorbereitung](images/lis3dh_preparation.png)

  * Die Lötbrücken beim *Firebeetle* verbinden, damit der bereits vorhandene Spannungsteiler (vgl. Schaltplan) zum Batteriestand messen verwendet werden kann.

![Firebeetle Vorbereitung](images/firebeetle_preparation.png)

### Zusammenbau

  * Am *Firebeetle* werden an folgenden Anschlüssen Kabel angelötet:
    * Batterie positiv
    * Batterie negativ
    * Ground `GND`
    * 3.3 Volt `3V3`
    * `IO27/D4`
  * Eine Stifleiste mit 4 Pins wird zudem an folgende Anschlüsse angebracht:
    * `SCK/IO18`
    * `MOSI/IO23`
    * `MISO/IO19`
    * `SDA/IO21`

![Firebeetle Kabel](images/firebeetle1.png)

  * Das Board wird dann mit den Anschlüssen nach unten in die gelochte Innenplatte gelegt. Die Kabel werden dabei durch die Platte gezogen.

  Das Board sollte an der Platte befestigt werden, z.B. mit kleinen Schrauben oder etwas Draht.

  ![Firebeetle Platte](images/firebeetle_plate.png)

  * Der *Firebeetle* wird nun mit dem *LIS3DH*  verbunden:
    * `3V3` auf Eingang Versorgungsspannung `Vin`
    * `GND` mit `GND` verbinden
    * `IO27/D4` auf Interrupt Pin `INT`

![Firebeetle LIS3DH 1](images/firebeetle_lis3dh1.png)

  * Anschliessend wird die Stifleiste mit den * LIS3DH*  mit den SPI-Anschlüssen `SCL`, `SDA`, `SDO` und `CS`
    verbunden und das Board somit ebenfalls fixiert.

![Firebeetle LIS3DH 2](images/firebeetle_lis3dh2.png)

  * Die Batterie mit den verbleibenden Kabeln vom *Firebeetle* verbinden (**dabei auf die Polung achten!**).
  Die Batterie auf der zweiten Innenplatte fixieren, z.B. mit etwas Klebeband.

![Batterie](images/battery_assembly.png)

  * Den Würfel zusammensetzen und abschliessend mit Kleber fixieren.
