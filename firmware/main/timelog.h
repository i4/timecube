
typedef class __attribute__ ((packed)) tle {
private:
	static const time_t side_mask = 0x7;
	static const time_t time_mask = ~side_mask;

	time_t value;
public:
	operator time_t() const { return value; }
	operator unsigned long() const {
		static_assert(std::is_same<unsigned long, std::make_unsigned<time_t>::type>::value, "time_t is not a long value");

		assert(value >= 0 && "value may not be negative!");
		return value;
	}

	tle& operator=(const tle &src) {
		value = src.value;
		return *this;
	}


	void set_side(uint8_t side) {
		assert(side == (side & side_mask) );
		value = get_time() | side;
	}

	uint8_t get_side() const {
		return value & side_mask;
	}

	void set_time(time_t ts) {
		value = (ts & time_mask) | get_side();
	}

	time_t get_time() const {
		return value & time_mask;
	}


	void set_time_to_now() {
		time_t now;
		time(&now);
		set_time(now);
	}
} tle;
static_assert(sizeof(time_t) == 4, "sizeof(time_t) must be 4 Bytes");
static_assert(sizeof(tle) == 4,    "sizeof(tle) must be 4 Bytes");

