function I2cMaster(i2cNum, options) {
    var sdaPin = options.sdaPin;
    var sclPin = options.sclPin;
    var freq = options.freq;

    this._i2cInstace = i2cInit(i2cNum, sdaPin, sclPin, freq);
}

I2cMaster.prototype.getInstace = function() {
    return this._i2cInstace;
}

function I2cDev(i2cInstace, slaveAddr) {
    this._addr = slaveAddr;
    this._timeout_ms = 1000;
    this._i2cInstace = i2cInstace;
}

I2cDev.prototype.readByteSync = function(offset, timeout) {
    var ret = i2cRead(this._i2cInstace, this._addr, offset, 1, timeout || this._timeout_ms);

    return ret[0];
}

I2cDev.prototype.readBytesSync = function(offset, length, timeout) {
    var ret = i2cRead(this._i2cInstace, this._addr, offset, length, timeout || this._timeout_ms);

    return ret;
}


I2cDev.prototype.readWordSync = function(offset, timeout) {
    var ret = i2cRead(this._i2cInstace, this._addr, offset, 2, timeout || this._timeout_ms);
    var data = (ret[0] & 0xFF) << 8 | (ret[1] & 0xFF);
    return data;
}

I2cDev.prototype.writeByteSync = function(offset, data, timeout) {
    var toWrite;
    if (data) {
        toWrite = new Uint8Array(1);
        toWrite[0] = data;
    } else {
        toWrite = new Uint8Array(0);
    }


    i2cWrite(this._i2cInstace, this._addr, offset, Uint8Array.plainOf(toWrite), timeout || this._timeout_ms);
}

I2cDev.prototype.writeWordSync = function(offset, data, timeout) {
    var toWrite = new Uint8Array(2);
    toWrite[0] = (data & 0xFF00) >> 8;
    toWrite[1] = data & 0xFF;
    i2cWrite(this._i2cInstace, this._addr, offset, Uint8Array.plainOf(toWrite), timeout || this._timeout_ms);
}

module.exports = {
    I2cMaster: I2cMaster,
    I2cDev:I2cDev
}
