var CONFIG_REG = 0x00;
var CONFIG_START = 0x01;
var CONFIG_INT_CLEAR = 0x01 << 3;

var INT_STAT_REG = 0x01;
var INT_MASK_REG = 0x03;
var INT_MASK_SETTING = 0xFF;
var CONV_RATE_REG = 0x07;
// Conversion rate
var CONTINU_MODE = 0x01;
var LOWPOWER_MODE = 0x00;


var CHAN_DIS_REG = 0x08;
var ONE_SHOT_REG = 0x09;
var DELAY_ONE_SHOT = 1000;
var CHAN_DIS_SETTING = 0x00;
var DEEP_SHUTDOWN_REG = 0x0A;

var ADV_CONFIG_REG = 0x0B; // select external reference
var EXTERNAL_REF_ENA = 0x01;
var INTERNAL_REF_ENA = 0x00;
var OPERATION_MODE0 = 0x00 << 1;  // chan 7 for temp sensor
var OPERATION_MODE1 = 0x01 << 1;  // normal
var OPERATION_MODE2 = 0x02 << 1;  // 4 diff input + hot temp
var OPERATION_MODE3 = 0x03 << 1;  // 4 single, 1 diff + hot temp

var BUSY_STAT_REG = 0x0C;
var LIMIT_REG1 = 0x2A;
var LIMIT_REG2 = 0x30;
var LIMIT_REG3 = 0x31;
var LIMIT_REG4 = 0x32;
var LIMIT_REG5 = 0x33;
var LIMIT_REG6 = 0x34;
var LIMIT_REG7 = 0x35;
var LIMIT_REG8 = 0x36;
var LIMIT_REG9 = 0x37;
var LIMIT_REG10 = 0x38;
var LIMIT_REG11 = 0x39;
var MANUFAC_ID_REG = 0x3E;
var REV_ID_REG = 0x3F;

function Adc(i2cInstace) {
    this._i2c = i2cInstace;
    this.bIntRef = true;
}

Adc.prototype.enADCRef = function () {
    if (this.bIntRef === true) {
        return INTERNAL_REF_ENA;
    } else {
        return EXTERNAL_REF_ENA;
    }
}

function toChannelOffset (chanId) {
    return (0x20 + chanId);
}

function toBoardChanelValue(chanId, value) {
    var ret;
    switch (chanId) {
        case 0:
        case 1:
            ret = value / 5000.0;
            break;
        case 2:
        case 3:
        case 7:
        case 8:
            ret = value * 2.0;
        case 5:
        case 6:
            ret = value * 30.0 / 230;
    }
    return ret.toFixed(4);
}

Adc.prototype.calcVal = function(val) {
    var num = 0.0;

    if (this.bIntRef) {
        num = val * 2.56 / 4096
    } else {
        num = val * 3.30 / 4096 ;
    }
    // console.log("num:",num)
    return Number(num.toFixed(4));
}

Adc.prototype.init = function() {
    var value = this.enADCRef() | OPERATION_MODE1;
    this._i2c.writeByteSync(ADV_CONFIG_REG, value);
    //this._i2c.writeByteSync(CONV_RATE_REG, CONTINU_MODE);
    this._i2c.writeByteSync(CONV_RATE_REG, LOWPOWER_MODE);
    this._i2c.writeByteSync(CHAN_DIS_REG, CHAN_DIS_SETTING);
    this._i2c.writeByteSync(INT_MASK_REG, INT_MASK_SETTING);
    this._i2c.writeByteSync(CONFIG_REG, 0x01);
    this._i2c.writeByteSync(DEEP_SHUTDOWN_REG, 0x01)
}

Adc.prototype.readChipInfo = function() {
    var data = this._i2c.readWordSync(MANUFAC_ID_REG);
    return {
        manufacturerID: (data & 0xFF00) >> 8,
        reversionID: data & 0xFF
    }
}

Adc.prototype.readChan = function(chanId) {
    //this._i2c.writeByteSync(toChannelOffset(chanId), null);
    //var value = this._i2c.readWordSync(0xFFFFFFFF);
    var data = this._i2c.readWordSync(toChannelOffset(chanId));
    data = (data & 0xFFF0) >> 4;
    console.log(`chainId ${chanId} data : ${data}`);
    //value = (value & 0xFF) << 4 | (value & 0xFF00 >> 12)
    var value = this.calcVal(data);
    return toBoardChanelValue(chanId, value);
}

Adc.prototype.start = function() {
    this._i2c.writeByteSync(CONV_RATE_REG, CONTINU_MODE);
    this._i2c.writeByteSync(CONFIG_REG, 0x01);
}

Adc.prototype.stop = function() {
    this._i2c.writeByteSync(CONFIG_REG, 0x0);
    this._i2c.writeByteSync(DEEP_SHUTDOWN_REG, 0x01);
}

Adc.prototype.readChanOneShot = function(chanId) {
    //this._i2c.writeByteSync(CONV_RATE_REG, CONTINU_MODE);
    //this._i2c.writeByteSync(CONFIG_REG, 0x01);
    this._i2c.writeByteSync(CONV_RATE_REG, LOWPOWER_MODE);
    this._i2c.writeByteSync(ONE_SHOT_REG, 0x01);

    var that = this;
    console.log('in readChanOneShot chanId', chanId);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var status = that._i2c.readByteSync(BUSY_STAT_REG);
            var data = that.readChan(chanId);
            console.log(`status: ${status} data: ${data}`);
            console.log('resolve is', resolve);
            resolve(data);
            //if (data & 0x01) {
            //    console.log('ADC convert busy');
            //    //reject(new Error('ADC convert still busy'));
            //} else {
            //    resolve(data);
            //}
        }, DELAY_ONE_SHOT);
    });
}

module.exports = {
    Adc:Adc
}
