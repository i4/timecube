/*! Based on Adafruit_LIS3DH.h
 *  by K. Townsend / Limor Fried (Adafruit Industries), 
 *  from https://github.com/adafruit/Adafruit_LIS3DH/
 *  modified by Bernhard Heinloth (2019)
 */
/*!
 *  @file Adafruit_LIS3DH.h
 *
 *  This is a library for the Adafruit LIS3DH Accel breakout board
 *
 *  Designed specifically to work with the Adafruit LIS3DH Triple-Axis
 *Accelerometer
 *	(+-2g/4g/8g/16g)
 *
 *  Pick one up today in the adafruit shop!
 *  ------> https://www.adafruit.com/product/2809
 *
 *	This sensor communicates over I2C or SPI (our library code supports
 *both) so you can share it with a bunch of other sensors on the same I2C bus.
 *  There's an address selection pin so you can have two accelerometers share an
 *I2C bus.
 *
 *  Adafruit invests time and resources providing this open source code,
 *  please support Adafruit andopen-source hardware by purchasing products
 *  from Adafruit!
 *
 *  K. Townsend / Limor Fried (Ladyada) - (Adafruit Industries).
 *
 *  BSD license, all text above must be included in any redistribution
 */

#if ARDUINO >= 100
 #include "Arduino.h"
#else
 #include "WProgram.h"
#endif

#include <SPI.h>

class Accelerometer {
	typedef enum {
		RANGE_16_G = 0b11, // +/- 16g
		RANGE_8_G  = 0b10, // +/- 8g
		RANGE_4_G  = 0b01, // +/- 4g
		RANGE_2_G  = 0b00  // +/- 2g (default value)
	} accel_range_t;

	typedef enum {
		AXIS_X = 0x0,
		AXIS_Y = 0x1,
		AXIS_Z = 0x2,
	} accel_axis_t;


	/* Used with register 0x2A (ACCEL_REG_CTRL_REG1) to set bandwidth */
	typedef enum {
		DATARATE_400_HZ     = 0b0111, // 400Hz
		DATARATE_200_HZ     = 0b0110, // 200Hz
		DATARATE_100_HZ     = 0b0101, // 100Hz
		DATARATE_50_HZ      = 0b0100, //  50Hz
		DATARATE_25_HZ      = 0b0011, //  25Hz
		DATARATE_10_HZ      = 0b0010, //  10Hz
		DATARATE_1_HZ       = 0b0001, //   1Hz
		DATARATE_POWERDOWN  = 0,
		DATARATE_LOWPOWER_1K6HZ  = 0b1000,
		DATARATE_LOWPOWER_5KHZ   = 0b1001,
	} accel_dataRate_t;

 public:
	Accelerometer(int8_t cspin);

	bool begin(accel_dataRate_t dataRate = DATARATE_10_HZ, accel_range_t range = RANGE_2_G);

	void read();

	void setMovementInterrupt(uint8_t movethresh = 0x20, uint8_t duration = 0x05);
	uint8_t getMovement(void);

	void setClickInterrupt(uint8_t mask, uint8_t clickthresh, uint8_t timelimit = 10, uint8_t timelatency = 20, uint8_t timewindow = 255);
	uint8_t getClick(void);

	int8_t x, y, z;

 private:
	uint8_t readRegister8(uint8_t reg);
	void writeRegister8(uint8_t reg, uint8_t value);
	int8_t _cs;
};
