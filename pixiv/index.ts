import { Plugin, App, JoinRoomEvent, PublicMessageEvent } from '@yakumoran/core'
import { WebForm } from '@yakumoran/core/dist/core/web/WebForm'
import axios from 'axios'
import { AxiosInstance } from 'axios'
import  pkg from './package.json'

export default (app: App) => {
  class OfficialPixiv extends Plugin {
    public form: WebForm
    public axios: AxiosInstance
    public rate: number

    async init () {
      this.plugin_author = '风间苏苏'
      this.plugin_description = ''
      this.plugin_id = 'pixiv'
      this.plugin_name = 'Pixiv搜图'
      this.plugin_version = pkg.version

      const hasTable = await this.app.db.schema.hasTable('plugin_pixiv')
      if (!hasTable) {
        await this.app.db.schema.createTable('plugin_pixiv', table => {
          table.string('key', 32).primary()
          table.string('content', 1024)
        })

        await this.app.db.batchInsert('plugin_pixiv', [{
          key: 'api',
          content: 'https://api.obfs.dev/'
        }, {
          key: 'rate',
          content: '4'
        }])
      }

      this.form = this.app.createForm('pixiv', 'Pixiv搜图', 'fa-solid fa-images')
      this.initForm()
      this.initAxios()
    }

    async initAxios () {
      this.axios = axios.create({
        baseURL: (await this.app.db.table('plugin_pixiv').where({ key: 'api' }).select('content').first()).content,
      })

      this.rate = Number((await this.app.db.table('plugin_pixiv').where({ key: 'rate' }).select('content').first()).content)
    }

    async initForm () {
      this.form.addText('Pixiv搜图', [
        'text-align: center',
        'font-size: 20px',
      ])

      const baseurl = (await this.app.db.table('plugin_pixiv').where({ key: 'api' }).select('content').first()).content
      const rate = (await this.app.db.table('plugin_pixiv').where({ key: 'rate' }).select('content').first()).content

      this.form.addInput('baseurl', 'text', 'API链接', {
        value: baseurl
      })

      this.form.addInput('rate', 'number', '涩图阈值(默认值4，可以过滤掉几乎所有涩图)', {
        value: rate
      })

      this.form.onSubmitted(this.handleConfigUpdate.bind(this))
    }

    recreateForm () {
      this.app.deleteForm(this.form)
      this.form = this.app.createForm('pixiv', 'Pixiv搜图', 'fa-solid fa-images')
      this.initForm()
    }

    async writeConfig (config) {
      const rate = config['pixiv-rate']
      const baseurl = config['pixiv-baseurl']
      const trans = await this.app.db.transaction()

      try {
        await trans.table('plugin_pixiv').update({ content: rate }).where({ key: 'rate' })
        await trans.table('plugin_pixiv').update({ content: baseurl }).where({ key: 'api' })
        await this.initAxios()
        await trans.commit()

        this.logger.info(`配置写入成功`)
      } catch (err) {
        await trans.rollback()
        this.logger.warn(`配置写入失败:`, err)
      }
    }

    handleConfigUpdate (config) {
      this.writeConfig(config)
      return `数据提交成功，具体信息请查看日志`
    }

    random (m, n) {
      return Math.floor(Math.random() * (n - m + 1) + m)
    }

    async search (keyword: string) {
      const illusts = []
      const resp = []
      for (let i = 1; i < 5; i++) {
        resp.push(this.axios.get(`/api/pixiv/search?word=${encodeURIComponent(keyword)}&page=${i}`))
      }
      const r = (await Promise.all(resp)).flat().map(e => { return e.data.illusts }).flat()
      const tmp = Object.values(r).filter((e: any) => {
        if (e.total_bookmarks > 300) return true
        return false
      })

      for (const item of tmp) {
        if (item.sanity_level > this.rate) continue
        illusts.push(item)
      }

      return illusts
    }

    @app.decorators.Command({
      command: /搜图(.*)/,
      desc: '搜图',
      name: 'search',
      usage: '搜图 xxx'
    })
    async setWelcome (event: PublicMessageEvent, match: RegExpMatchArray) {
      const keyword = match[1]

      try {
        const illusts = await this.search(keyword)

        if (illusts.length === 0) {
          this.app.api.sendPublicMessage(`没有找到与 ${keyword} 相关的图片`)
          return
        }

        const artwork = illusts[this.random(0, illusts.length - 1)]

        const url = (artwork.meta_pages.length > 0 ? artwork.meta_pages[0].image_urls.original : artwork.meta_single_page.original_image_url).replace('i.pximg.net', 'pix.3m.chat')
        const tags = Object.values(artwork.tags).map((item: any) => `🏷️${item.translated_name || item.name}`).join(' ')
        const author = `👤${artwork.user.name}`

        const message = [
          `[${url}#e]`,
          '',
          `📖${artwork.title}`,
          author,
          tags,
          '',
          `💖${artwork.total_bookmarks} 👁️${artwork.total_view}`
        ].join('\n')
      } catch (error) {
        this.app.api.sendPublicMessage('[Pixiv] 搜索失败: ' + error.message)
      }
    }
  }

  return OfficialPixiv
}