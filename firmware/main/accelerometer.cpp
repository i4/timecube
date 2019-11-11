/*! Based on Adafruit_LIS3DH.cpp
 *  by K. Townsend / Limor Fried (Adafruit Industries), 
 *  from https://github.com/adafruit/Adafruit_LIS3DH/
 *  modified by Bernhard Heinloth (2019)
 */
/*!
 * @file Adafruit_LIS3DH.cpp
 *
 *  @mainpage Adafruit LIS3DH breakout board
 *
 *  @section intro_sec Introduction
 *
 *  This is a library for the Adafruit LIS3DH Accel breakout board
 *
 *  Designed specifically to work with the Adafruit LIS3DH Accel breakout board.
 *
 *  Pick one up today in the adafruit shop!
 *  ------> https://www.adafruit.com/product/2809
 *
 *  This sensor communicates over I2C or SPI (our library code supports both) so
 * you can share it with a bunch of other sensors on the same I2C bus.
 *
 *  Adafruit invests time and resources providing this open source code,
 *  please support Adafruit andopen-source hardware by purchasing products
 *  from Adafruit!
 *
 *  @section author Author
 *
 *  K. Townsend / Limor Fried (Adafruit Industries)
 *
 *  @section license License
 *
 *  BSD license, all text above must be included in any redistribution
 */

#include "accelerometer.h"

enum REG {
	REG_STATUS1     = 0x07,
	REG_OUTADC1_L   = 0x08,
	REG_OUTADC1_H   = 0x09,
	REG_OUTADC2_L   = 0x0A,
	REG_OUTADC2_H   = 0x0B,
	REG_OUTADC3_L   = 0x0C,
	REG_OUTADC3_H   = 0x0D,
	REG_INTCOUNT    = 0x0E,
	REG_WHOAMI      = 0x0F,
	REG_TEMPCFG     = 0x1F,
	REG_CTRL1       = 0x20,
	REG_CTRL2       = 0x21,
	REG_CTRL3       = 0x22,
	REG_CTRL4       = 0x23,
	REG_CTRL5       = 0x24,
	REG_CTRL6       = 0x25,
	REG_REFERENCE   = 0x26,
	REG_STATUS2     = 0x27,
	REG_OUT_X_L     = 0x28,
	REG_OUT_X_H     = 0x29,
	REG_OUT_Y_L     = 0x2A,
	REG_OUT_Y_H     = 0x2B,
	REG_OUT_Z_L     = 0x2C,
	REG_OUT_Z_H     = 0x2D,
	REG_FIFOCTRL    = 0x2E,
	REG_FIFOSRC     = 0x2F,
	REG_INT1CFG     = 0x30,
	REG_INT1SRC     = 0x31,
	REG_INT1THS     = 0x32,
	REG_INT1DUR     = 0x33,
	REG_INT2CFG     = 0x34,
	REG_INT2SRC     = 0x35,
	REG_INT2THS     = 0x36,
	REG_INT2DUR     = 0x37,
	REG_CLICKCFG    = 0x38,
	REG_CLICKSRC    = 0x39,
	REG_CLICKTHS    = 0x3A,
	REG_TIMELIMIT   = 0x3B,
	REG_TIMELATENCY = 0x3C,
	REG_TIMEWINDOW  = 0x3D,
	REG_ACTTHS      = 0x3E,
	REG_ACTDUR      = 0x3F
};

Accelerometer::Accelerometer(int8_t cspin) : _cs(cspin) { }

bool Accelerometer::begin(accel_dataRate_t dataRate, accel_range_t range) {
	digitalWrite(_cs, HIGH);
	pinMode(_cs, OUTPUT);

	// hardware SPI
	SPI.begin();

	/* Check connection */
	uint8_t deviceid = readRegister8(REG_WHOAMI);
	if (deviceid != 0x33) {
		/* No LIS3DH detected ... return false */
		return false;
	}

	// enable all axes, normal mode
	writeRegister8(REG_CTRL1, 0x0f | (dataRate << 4));

	// Block data update
	writeRegister8(REG_CTRL4, 0x80 | (range << 4));

	writeRegister8(REG_CTRL5, 0x0a); // latch interrupt on int1 & int2

	return true;
}


void Accelerometer::read(void) {
	// read x y z at once

	SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE0));
	digitalWrite(_cs, LOW);
	SPI.transfer(REG_OUT_X_L | 0x80 | 0x40); // read multiple, bit 7&6 high

	SPI.transfer(0xFF);
	x = SPI.transfer(0xFF);
	SPI.transfer(0xFF);
	y = SPI.transfer(0xFF);
	SPI.transfer(0xFF);
	z = SPI.transfer(0xFF);

	digitalWrite(_cs, HIGH);
	SPI.endTransaction();

}

void Accelerometer::setMovementInterrupt(uint8_t movethresh, uint8_t duration) {
	uint8_t r = readRegister8(REG_CTRL3);
	r |= (0x20); // turn on IA2
	writeRegister8(REG_CTRL3, r);

	writeRegister8(REG_INT2THS, movethresh); // arbitrary
	writeRegister8(REG_INT2DUR, duration); // arbitrary

	writeRegister8(REG_INT2CFG, 0x7f); // turn on all axes + 6D
}

uint8_t Accelerometer::getMovement(void) {
	return readRegister8(REG_INT2SRC);
}

void Accelerometer::setClickInterrupt(uint8_t mask, uint8_t clickthresh, uint8_t timelimit, uint8_t timelatency, uint8_t timewindow) {
	uint8_t r = readRegister8(REG_CTRL3);
	if (mask == 0) {
		//disable int
		r &= ~(0x80); // turn off I1_CLICK
		writeRegister8(REG_CTRL3, r);
		writeRegister8(REG_CLICKCFG, 0);
		return;
	}
	// else...
	r |= (0x80); // turn on I1_CLICK
	writeRegister8(REG_CTRL3, r);

	writeRegister8(REG_CLICKCFG, ((mask & 1) != 0 ?  0x15 : 0) | ((mask & 2) != 0 ?  0x2a : 0)); // turn on all axes & tap

	writeRegister8(REG_CLICKTHS,    clickthresh); // arbitrary
	writeRegister8(REG_TIMELIMIT,   timelimit);   // arbitrary
	writeRegister8(REG_TIMELATENCY, timelatency); // arbitrary
	writeRegister8(REG_TIMEWINDOW,  timewindow);  // arbitrary
}

uint8_t Accelerometer::getClick(void) {
	return readRegister8(REG_CLICKSRC);
}


void Accelerometer::writeRegister8(uint8_t reg, uint8_t value) {
	SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE0));
	digitalWrite(_cs, LOW);
	SPI.transfer(reg & ~0x80); // write, bit 7 low
	SPI.transfer(value);
	digitalWrite(_cs, HIGH);
	SPI.endTransaction(); // release the SPI bus
}

uint8_t Accelerometer::readRegister8(uint8_t reg) {
	SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE0));
	digitalWrite(_cs, LOW);
	SPI.transfer(reg | 0x80); // read, bit 7 high
	uint8_t value = SPI.transfer(0);
	digitalWrite(_cs, HIGH);
	SPI.endTransaction(); // release the SPI bus
	return value;
}
