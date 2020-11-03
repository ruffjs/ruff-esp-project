function Sht20(i2cInstace) {
    this._i2c = i2cInstace;
}

Sht20.prototype.getTemp = function() {
    let that = this;
    this._i2c.writeByteSync(0xFFFFFFFF, 0xF3);

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let value = that._i2c.readBytesSync(0xFFFFFFFF, 3);
            let data = (value[0] << 8) | (value[1]  & 0xFC);
            let temp = data * 175.72 / Math.pow(2, 16) - 46.85;
            resolve(temp.toFixed(3));
        }, 100);
    });
}

Sht20.prototype.getRelHumid = function() {
    let that = this;
    this._i2c.writeByteSync(0xFFFFFFFF, 0xF5);

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let value = that._i2c.readBytesSync(0xFFFFFFFF, 3);
            let data = (value[0] << 8) | (value[1]  & 0xFC);
            let temp = data * 125.0 / Math.pow(2, 16) - 6;
            resolve(temp.toFixed(3));
        }, 100);
    });
}

module.exports = {
    Sht20: Sht20
}
