import { Plugin, App, JoinRoomEvent, PublicMessageEvent } from '@yakumoran/core'
import { promises as fs } from 'fs'
import { join } from 'path'
import { Router, static as ExpressStatic } from 'express'

export default (app: App) => {
  class OfficialLogViewer extends Plugin {
    async init () {
      this.plugin_author = '风间苏苏'
      this.plugin_description = ''
      this.plugin_id = 'logviewer'
      this.plugin_name = '日志查看器'
      this.plugin_version = '2.0.4'

      const route = Router()
      route.use(ExpressStatic(join(__dirname, 'public')))

      route.get('/logs', async (req, res) => {
        const year = new Date().getFullYear()
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
        const day = new Date().getDate().toString().padStart(2, '0')
        const filename = `default.${year}-${month}-${day}.log`
        const filepath = join(process.cwd(), 'logs', filename)
        const data = await fs.readFile(filepath, 'utf-8')
        res.send(data)
      })

      this.app.web.route('/logviewer', route)

      const form = this.app.createForm('logviewer', '日志', 'fa-solid fa-gears')

      form.addIframe('/logviewer')
    }
  }

  return OfficialLogViewer
}