var app_test = require('./app_util').app_test;
const {Sht20 } = require('./sht20');
const {I2cMaster, I2cDev}  = require('./i2c');
var Adc = require('./adc128d818').Adc;

function uartChipTest() {
    console.log('in uart chip test');
    var i2cHandler = i2cInit(1, 23, 22, 400000);
    var writeData = Buffer.from([0x16], 'hex');
    console.log('write data:', writeData);
    i2cWrite(i2cHandler, 0x35, 0x30, Uint8Array.plainOf(writeData), 1000);
    console.log(i2cRead(i2cHandler, 0x35, 0x30, 1, 1000));
}

const i2c2 = new I2cMaster(0, {sdaPin: 18, sclPin: 5, freq: 400000});
const i2c1 = new I2cMaster(1, {sdaPin: 23, sclPin: 22, freq: 400000});

function rtcTest() {
    var rtc = new I2cDev(i2c2.getInstace(), 0x68);

    rtc.writeByteSync(7, 0x80);
    rtc.writeByteSync(0, 0);
    rtc.writeByteSync(1, 0x80);

    setInterval(() => {
        console.log('rtc 0:', rtc.readByteSync(0));
    }, 1500);
}

function tempHumidTest() {
    var tempHumid = new Sht20(new I2cDev(i2c2.getInstace(), 0x40));
    tempHumid.getTemp().then((value) => {
        console.log('temp value', value);
        tempHumid.getRelHumid().then((value) => {
            console.log('Humid value', value);
        });
    });
}

function adcChipTest() {

    var lsm = new I2cDev(i2c2.getInstace(), 0x6b);
    var dev = new I2cDev(i2c1.getInstace(), 0x1D);

    pinMode(4, OUTPUT);
    digitalWrite(4, HIGH);

    var adc = new Adc(dev);

    console.log('adc info:', adc.readChipInfo());
    adc.init()
    function adcIterRead(id) {
        if (id > 8) {
            return;
        }
        console.log('before read one shot');
        adc.readChanOneShot(id).then((value) => {
            console.log(`chanId: ${i} value: ${value}`);
            //adcIterRead(id + 1);
        }).catch((err)=> {
            console.log('fail to resove when readChanOneShot', err);
        });
    }

    //setInterval(() => {
        adcIterRead(0);
        //adc.readChanOneShot(0).then((value) => {
        //    console.log(`chanId: 0  value: ${value}`);
        //})
    //}, 10000);

}
function initBoardPinmux() {
    Uart.setUartPinmux([
    {id: 1, tx: 4, rx: 2},
    {id: 2, tx: 32, rx: 35},
    ]);
}

setInterval(function() {
    console.log('hello ruff');
}, 20000);


function nbTest() {
    var nbConfig = {
        cmConf: {
            host: '183.230.40.40',
            port: 5683,
            lifetime: 86400,
            regTimeout: 60,
            attachWaitTimes: 20,
        },
        cuConf: {
            host: '119.3.250.80',
            port: 5683,
            attachWaitTimes: 40,
        },
        ctConf: {
            host: '117.60.157.137',
            port: 5683,
            attachWaitTimes: 20,
        }
    };

    //uartOptions.uartId, uartOptions.baudRate, uartOptions.config, uartOptions.queueLen, uartOptions.inverted);
    var nbUartConfig = {
        pwrPin: 15,
        uart: {
            uartId: 2,
            baudRate: 9600,
            config: RUFF_UART.SERIAL_8N1,
            queueLen: 64,
            inverted: false,
        }
    }
    var nbClient = new NbClient.NbClient(nbUartConfig, nbConfig);

    nbClient.init();
}

function gen_os_ota_worker(num) {
    var maxTry = num;
    var tryNum = 0;
    function do_os_ota(url) {
        console.log('Before do OS OTA');

        var ret = RUFF_OTA.el_ruff_update_os('http://68.79.31.165:10025/ota.image');
        if (ret !== 0) {
            tryNum += 1;
            if (tryNum >= maxTry) {
                console.log('give up ota for max try number matched');
            }
            setTimeout(do_os_ota, 3000);
        }
    }
    return do_os_ota;
}

function cmux_and_pppos_test() {
    var cmux_id = RUFF_CMUX.el_ruff_cmux_init();
    console.log('in cmux_and_pppos_test cmux_id:', cmux_id);
    RUFF_PPP.el_ruff_start_ppp_client(cmux_id);
    console.log('before do ota start');
    //var client_ota = RUFF_OTA.el_ruff_ota_start('ws://68.79.31.165:10025/test_1234');

    gen_os_ota_worker(4).call(null);
    var cmuxUart = new CmuxUart(cmux_id);
    cmuxUart.on('data', function(data) {
        console.log('cmux uart received: ', data);
    });

    cmuxUart.write(new Buffer('AT\r\n'));
}

function ruff_industry_board_init() {
    pinMode(0, OUTPUT);
    console.log('Power off Modem');
    digitalWrite(0, HIGH);

    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            console.log('Power on Modem');
            digitalWrite(0, LOW);
            resolve();
        }, 2000);
    });
}

function sockTest() {
    console.log('befoer socket connect');
    var socketClient = socket.sockConnect(false, '68.79.31.165', 10025,
        function(sock) {
            setInterval(function() {
                console.log('before write data to sock');
                sock.write('hello world\n');
                sock.flush();
            }, 2000);
        },
        function(data, fd, len) {
            console.log('##### received data', data);
        },
        function( err) {
            console.log('#### error is', err);
        },
        function() {
            console.log('#### socket closed');
        });
}

function wifiTest() {
    Wifi.startWifi();
    console.log('Before connecting wifi');
    Wifi.connectWifi('nanchao-2', 'nanchao.org', function(status) {
        console.log('wifi event:', status);
        if (status === 'connect') {
            console.log('before wifi test');
            gen_os_ota_worker(4).call(null);
            sockTest();
        }
    });
}
initBoardPinmux();
console.log('#####this is tope test ####');
//uartChipTest();
adcChipTest();
//ruff_industry_board_init().then(function() {
//    console.log('hi this is app');
//    setTimeout(cmux_and_pppos_test, 20000);
//});
//nbTest();
//wifiTest();
