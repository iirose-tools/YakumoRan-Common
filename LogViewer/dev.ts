import { App } from '@yakumoran/core'
import * as fs from 'fs'

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const app = new App(config)

for (const name in config.plugins) {
  app.loadPlugin(fs.existsSync(`${process.cwd()}/${name}`) ? `${process.cwd()}/${name}` : name)
}
