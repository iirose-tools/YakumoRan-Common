import { Plugin, App, JoinRoomEvent, PublicMessageEvent } from '@yakumoran/core'
import { WebForm } from '@yakumoran/core/dist/core/web/WebForm'

export default (app: App) => {
  class OfficialWelcome extends Plugin {
    public form: WebForm
    public UserLock: Map<string, boolean> = new Map()

    async init () {
      this.plugin_author = '风间苏苏'
      this.plugin_description = ''
      this.plugin_id = 'welcome'
      this.plugin_name = '自动欢迎'
      this.plugin_version = '2.0.2'

      const hasTable = await this.app.db.schema.hasTable('plugin_welcome')
      if (!hasTable) {
        await this.app.db.schema.createTable('plugin_welcome', table => {
          table.string('uid', 32)
          table.string('type', 32).defaultTo('createByUser')
          table.string('content', 1024)
        })

        const sentences = [
          [
            // 早上
            '{at} 早上好，阁下昨晚睡的怎样？今天也要元气满满哦~',
            '{at} 早上好，一日之计在于晨，早起是个好习惯！',
            '{at} 早上好阁下，新的一天开始啦，不要忘记吃早饭哦~',
            '{at} 阁下早上好，一起来拥抱世界吧~',
            '{at} 早上好，阁下是刚醒还是没睡?'
          ],
          [
            // 中午
            '{at} 阁下中午好，要睡个午觉嘛？',
            '{at} 午安阁下，来打个盹吧~',
            '{at} 中午了中午了！午餐铃响了没？记得按时吃饭~',
            '{at} 干饭人，干饭魂，不干饭就没精神！阁下中午记得要好好吃饭哦~',
            '{at} 吃饱喝足，最适合睡午觉啦！阁下要不要休息一下养养膘~'
          ],
          [
            // 下午
            '{at} 下午好, 愿我的问候如清冷的早晨般滋养阁下！',
            '{at} 有没有睡午觉呀？下午是非常容易犯困的时段，阁下要加油哦！',
            '{at} 下午好下午好！阁下要不要来杯下午茶？',
            '{at} 下午好呀~不知道阁下有没有好好午休呢！午休过后会更有精神哦~',
            '{at} 阁下下午好！一天的时间已经过去大半啦~'
          ],
          [
            // 晚上
            '{at} 晚好，我正通过最亮的星为阁下许愿呢~',
            '{at} 晚上好~ 累了一天，记得要早点休息哟~',
            '{at} 无论天气如何，心里都要装着小星星哦~阁下晚上好！',
            '{at} 晚上好呀~累了一天辛苦啦！{nickname}一直都在阁下身旁，加油！',
            '{at} 阁下晚上好~今晚也要记得早点休息，{nickname}提前祝您晚安好梦~'
          ],
          [
            // 半夜
            '欢迎光临，现在是凌晨，阁下{at}的头发还好吗？',
            '{at} 萤火虫都去歇息了，阁下怎么还不睡觉？',
            '{at} 月亮不睡我不睡，阁下先请~',
            '{at} 让我看看是哪个不听话的孩子还没有乖乖睡觉！【气fufu】',
            '{at} 已经很晚啦，阁下也要早点休息，晚安~'
          ],
          [
            // 特殊
            '{at} 欢迎回来，kokodayo~',
            '{at} 欢迎光临，祝您十连五个金，不过运气谁都有，谁先用完谁先走',
            '{at} 欢迎光临，哼、哼、啊啊啊啊啊啊啊啊'
          ],
          [
            // 新人
            [
              '欢迎来到蔷薇花园，这里是一个多功能聊天室~',
              '我们可以在这里一起聊天，听音乐，看视频~',
              '——————————————————————————',
              '输入@+歌名 点歌',
              '输入#+视频名 点视频',
              '',
              '点击左下角头像  可以发送表情🌸',
              '点击右下角‘+’号  查看更多功能',
              '还有不懂的可以点一下这个哦~ [*教程*]  ',
              '',
              'http://r.iirose.com/i/20/1/22/13/3826-IF.jpg#e'
            ].join('\n')
          ]
        ]

        await this.app.db.batchInsert('plugin_welcome', sentences[0].map((sentence) => {
          return {
            uid: 'default',
            type: 'morning',
            content: sentence
          }
        }))

        await this.app.db.batchInsert('plugin_welcome', sentences[1].map((sentence) => {
          return {
            uid: 'default',
            type: 'noon',
            content: sentence
          }
        }))

        await this.app.db.batchInsert('plugin_welcome', sentences[2].map((sentence) => {
          return {
            uid: 'default',
            type: 'afternoon',
            content: sentence
          }
        }))

        await this.app.db.batchInsert('plugin_welcome', sentences[3].map((sentence) => {
          return {
            uid: 'default',
            type: 'evening',
            content: sentence
          }
        }))

        await this.app.db.batchInsert('plugin_welcome', sentences[4].map((sentence) => {
          return {
            uid: 'default',
            type: 'midnight',
            content: sentence
          }
        }))

        await this.app.db.batchInsert('plugin_welcome', sentences[5].map((sentence) => {
          return {
            uid: 'default',
            type: 'special',
            content: sentence
          }
        }))

        await this.app.db.batchInsert('plugin_welcome', sentences[6].map((sentence) => {
          return {
            uid: 'default',
            type: 'new',
            content: sentence
          }
        }))
      }

      this.form = this.app.createForm('welcome', '自动欢迎', 'fa-solid fa-handshake')
      this.initForm()
    }

    async initForm () {
      this.form.addText('自动欢迎', [
        'text-align: center',
        'font-size: 20px',
      ])

      this.form.addText('除了新人欢迎词，其他的均为每行一个独立欢迎词', [
        'text-align: center',
        'font-size: 16px',
      ])

      this.form.addInput('morning', 'textarea', '早上 (5:00 ~ 10:00)', {
        value: await (await this.app.db.table('plugin_welcome').where({ type: 'morning' }).select('content')).map((item) => item.content).join('\n')
      })

      this.form.addInput('noon', 'textarea', '中午 (10:00 ~ 13:00)', {
        value: await (await this.app.db.table('plugin_welcome').where({ type: 'noon' }).select('content')).map((item) => item.content).join('\n')
      })

      this.form.addInput('afternoon', 'textarea', '下午 (14:00 ~ 19:00)', {
        value: await (await this.app.db.table('plugin_welcome').where({ type: 'afternoon' }).select('content')).map((item) => item.content).join('\n')
      })

      this.form.addInput('evening', 'textarea', '晚上 (20:00 ~ 23:00)', {
        value: await (await this.app.db.table('plugin_welcome').where({ type: 'evening' }).select('content')).map((item) => item.content).join('\n')
      })

      this.form.addInput('midnight', 'textarea', '半夜 (24:00 ~ 28:00)', {
        value: await (await this.app.db.table('plugin_welcome').where({ type: 'midnight' }).select('content')).map((item) => item.content).join('\n')
      })

      this.form.addInput('special', 'textarea', '小概率触发的特殊欢迎词', {
        value: await (await this.app.db.table('plugin_welcome').where({ type: 'special' }).select('content')).map((item) => item.content).join('\n')
      })

      this.form.addInput('special', 'textarea', '新人欢迎词', {
        value: await (await this.app.db.table('plugin_welcome').where({ type: 'new' }).select('content').first()).content
      })

      this.form.onSubmitted(this.handleConfigUpdate)
    }

    recreateForm () {
      this.app.deleteForm(this.form)
      this.form = this.app.createForm('welcome', '自动欢迎', 'fa-solid fa-handshake')
      this.initForm()
    }

    async writeConfig (config) {
      async () => {
        const morning = config['welcome-morning'].split('\n')
        const noon = config['welcome-noon'].split('\n')
        const afternoon = config['welcome-afternoon'].split('\n')
        const evening = config['welcome-evening'].split('\n')
        const midnight = config['welcome-midnight'].split('\n')
        const special = config['welcome-special'].split('\n')
        const newUser = config['welcome-new']

        const trans = await this.app.db.transaction()

        try {
          await trans.table('plugin_welcome').where({ type: 'morning' }).delete()
          await trans.table('plugin_welcome').where({ type: 'noon' }).delete()
          await trans.table('plugin_welcome').where({ type: 'afternoon' }).delete()
          await trans.table('plugin_welcome').where({ type: 'evening' }).delete()
          await trans.table('plugin_welcome').where({ type: 'midnight' }).delete()
          await trans.table('plugin_welcome').where({ type: 'special' }).delete()
          await trans.table('plugin_welcome').where({ type: 'new' }).delete()

          await trans.batchInsert('plugin_welcome', morning.map((sentence) => {
            return {
              uid: 'default',
              type: 'morning',
              content: sentence
            }
          }))

          await trans.batchInsert('plugin_welcome', noon.map((sentence) => {
            return {
              uid: 'default',
              type: 'noon',
              content: sentence
            }
          }))

          await trans.batchInsert('plugin_welcome', afternoon.map((sentence) => {
            return {
              uid: 'default',
              type: 'afternoon',
              content: sentence
            }
          }))

          await trans.batchInsert('plugin_welcome', evening.map((sentence) => {
            return {
              uid: 'default',
              type: 'evening',
              content: sentence
            }
          }))

          await trans.batchInsert('plugin_welcome', midnight.map((sentence) => {
            return {
              uid: 'default',
              type: 'midnight',
              content: sentence
            }
          }))

          await trans.batchInsert('plugin_welcome', special.map((sentence) => {
            return {
              uid: 'default',
              type: 'special',
              content: sentence
            }
          }))

          await trans.table('plugin_welcome').insert({
            uid: 'default',
            type: 'new',
            content: newUser
          })

          trans.commit()
          this.recreateForm()
        } catch (error) {
          trans.rollback(error)
          this.logger.info('数据写入失败:', error)
        }
      }
    }

    handleConfigUpdate (config) {
      this.writeConfig(config)
      return `数据提交成功，具体信息请查看日志`
    }

    random (m, n) {
      return Math.floor(Math.random() * (n - m + 1) + m)
    }

    @app.decorators.Command({
      command: /\/wb set (.*)/,
      desc: '设置欢迎词',
      name: 'wb-set',
      usage: '/wb set ...'
    })
    async setWelcome (event: PublicMessageEvent, match: RegExpMatchArray) {
      const content = match[1]
      const uid = event.uid

      try {
        await this.app.db.table('plugin_welcome').insert({
          uid,
          content
        })
  
        this.app.api.sendPublicMessage('[Welcome] 设置成功')
      } catch (error) {
        this.app.api.sendPublicMessage('[Welcome] 设置失败')
      }
    }

    @app.decorators.Command({
      command: /\/wb del/,
      desc: '删除欢迎词',
      name: 'wb-del',
      usage: '/wb del'
    })
    async delWelcome (event: PublicMessageEvent, match: RegExpMatchArray) {
      const uid = event.uid

      try {
        await this.app.db.table('plugin_welcome').where({ uid }).delete()
        this.app.api.sendPublicMessage('[Welcome] 设置成功')
      } catch (error) {
        this.app.api.sendPublicMessage('[Welcome] 设置失败')
      }
    }

    @app.decorators.EventListener('JoinRoom')
    async onJoinRoom(event: JoinRoomEvent) {
      const uid = event.uid
      if (this.UserLock.get(uid)) return

      this.UserLock.set(uid, true)

      setTimeout(() => {
        this.UserLock.delete(uid)
      }, 10e3);

      const userConfig = await this.app.db.table('plugin_welcome').where({ uid: event.uid }).first()

      if (userConfig) {
        // 自定义欢迎词
        const { content } = userConfig
        await this.app.api.sendPublicMessage(`  [*${event.username}*]  ${content}`)
        return
      }

      if (event.uid.startsWith('X')) {
        // 新人
        const { content } = await this.app.db.table('plugin_welcome').where({ type: 'new' }).first()
        await this.app.api.sendPublicMessage(`  [*${event.username}*]  ${content}`)
        return
      }

      const hours = new Date().getHours()

      let welcome = '欢迎回来~'

      if (hours >= 5 && hours <= 10) {
        // 5:00 ~ 10:00
        const sentences = await (await this.app.db.table('plugin_welcome').where({ type: 'morning' }).select('content')).map((item) => item.content)
        const len = sentences.length
        welcome = sentences[this.random(0, len - 1)]
      } else if (hours >= 11 && hours <= 13) {
        // 11:00 ~ 13:00
        const sentences = await (await this.app.db.table('plugin_welcome').where({ type: 'noon' }).select('content')).map((item) => item.content)
        const len = sentences.length
        welcome = sentences[this.random(0, len - 1)]
      } else if (hours >= 14 && hours <= 18) {
        // 14:00 ~ 19:00
        const sentences = await (await this.app.db.table('plugin_welcome').where({ type: 'afternoon' }).select('content')).map((item) => item.content)
        const len = sentences.length
        welcome = sentences[this.random(0, len - 1)]
      } else if (hours >= 19 && hours <= 23) {
        // 20:00 ~ 23:00
        const sentences = await (await this.app.db.table('plugin_welcome').where({ type: 'evening' }).select('content')).map((item) => item.content)
        const len = sentences.length
        welcome = sentences[this.random(0, len - 1)]
      } else if (hours <= 4 || hours >= 24) {
        // 24:00 ~ 28:00
        const sentences = await (await this.app.db.table('plugin_welcome').where({ type: 'midnight' }).select('content')).map((item) => item.content)
        const len = sentences.length
        welcome = sentences[this.random(0, len - 1)]
      }

      const isSpecial = Math.random() < 0.1

      if (isSpecial) {
        const sentences = await (await this.app.db.table('plugin_welcome').where({ type: 'special' }).select('content')).map((item) => item.content)
        const len = sentences.length
        welcome = sentences[this.random(0, len - 1)]
      }

      welcome = welcome.replace('{at}', `  [*${event.username}*]  `)
      await this.app.api.sendPublicMessage(welcome)
    }
  }

  return OfficialWelcome
}