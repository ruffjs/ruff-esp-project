const { program } = require('commander')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const buildFolder = path.join(__dirname, '../build')
const storageFile = path.join(buildFolder, 'storage.bin')

program.version('0.1.0')

program
  .option('-f, --flash', 'run flash command')
  .option('-s, --spiffs', 'generate spiffs')
  .option('-p, --port <serialport>', 'serial port')

program.parse(process.argv)

if (program.spiffs) {
  if (fs.existsSync(storageFile)) {
    fs.unlinkSync(storageFile)
  } else {
    if (!fs.existsSync(buildFolder)) {
      fs.mkdirSync(buildFolder)
    }
  }
  let spiffsCmd = `python3 ./tools/spiffsgen.py 0x100000 ./dist build/storage.bin --page-size=256 \
--obj-name-len=128 --meta-len=4 --use-magic --use-magic-len`
  execSync(spiffsCmd, { stdio: [0, 1, 2] })
}

if (program.flash) {
  let command = `python3 tools/esptool.py -p ${program.port} -b 460800 --before default_reset --after hard_reset \
    --chip esp32 write_flash --flash_mode dio --flash_freq 80m --flash_size 8MB \
    0x610000 build/storage.bin`

  execSync(command, { stdio: [0, 1, 2] })
}
