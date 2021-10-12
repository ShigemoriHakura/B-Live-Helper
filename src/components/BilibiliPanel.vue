<template>
  <v-container style="max-width: 100%!important;">
    <div class="text-center">
      <v-dialog v-model="dialogShow" width="500">
        <v-card>
          <v-card-title class="headline grey lighten-2">
            {{dialogText}}： {{dialogUserName}} ({{dialogUserId}}) ？
          </v-card-title>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="danger" text @click="dialogRun">
              确定
            </v-btn>
            <v-btn color="primary" text @click="dialogClose">
              取消
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
    <v-container v-if="!$store.state.config.isLogin" style="max-width: 100%!important;">
      请先登录账号再使用本功能！
    </v-container>
    <v-container v-if="$store.state.config.isLogin" style="max-width: 100%!important;">
      <v-tabs>
        <v-tab>
          首页
        </v-tab>
        <v-tab>
          弹幕播报
        </v-tab>
        <v-tab-item>
          <v-row>
            <v-col cols="12" md="12">
              <v-btn class="ma-2" elevation="2" color="success" @click="switchDanmakuHime">开启/关闭弹幕显示</v-btn>
              <v-btn class="ma-2" elevation="2" color="warning" @click="clearDanmakuList">清除历史弹幕</v-btn>
            </v-col>
            <v-col cols="12" md="12">
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">
                        发送时间
                      </th>
                      <th class="text-left">
                        用户名
                      </th>
                      <th class="text-left">
                        UID
                      </th>
                      <th class="text-left">
                        弹幕内容
                      </th>
                      <th class="text-left">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in $store.state.roomInfo.danmakuList" :key="item.uniqueId">
                      <td>{{ item.time * 1000 | formatDate }}</td>
                      <td>{{ item.nickname }}</td>
                      <td>{{ item.userId }}</td>
                      <td>{{ item.content }}</td>
                      <!--<v-btn class="ma-2" elevation="2" color="warning"
                        @click="dialogSet('addManager', item.nickname, item.userId)">房管</v-btn>
                      <v-btn class="ma-2" elevation="2" @click="dialogSet('block', item.nickname, item.userId)">拉黑
                      </v-btn>-->
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-col>
          </v-row>
        </v-tab-item>
        <v-tab-item>
          <DanmakuTTS />
        </v-tab-item>
      </v-tabs>
    </v-container>
  </v-container>
</template>

<script>
import eConfig from "electron-config"
import cookie from "cookie"
import got from "got"
import { remote, shell } from 'electron'
import { formatDate } from '@/utils/timeFormat'
import yaml from "js-yaml"
import { version } from 'js-base64'
import DanmakuTTS from '@/components/Mate/DanmakuTTS.vue'

const COMMAND_HEARTBEAT = 0
const COMMAND_JOIN_ROOM = 1
const COMMAND_ADD_TEXT = 2
const COMMAND_ADD_GIFT = 3
const COMMAND_ADD_MEMBER = 4
const COMMAND_ADD_SUPER_CHAT = 5
const COMMAND_DEL_SUPER_CHAT = 6
const COMMAND_ADD_FOLLOW = 10
const COMMAND_ADD_JOIN_GROUP = 11
const COMMAND_JOIN_ROOM_Guard = 12

export default {
  name: 'BilibiliPanel',
  data: () => ({
    //弹窗
    dialogShow: false,
    dialogText: "",
    dialogUserName: "",
    dialogUserId: "",
    dialogAction: "",

    danmakuWindow: null,
    danmakuText: "",

    TTSTimer: 0,
  }),
  components: {
    DanmakuTTS,
  },
  watch: {
    categoryId: {
      handler(val) {
        this.more = this.categoryMore[val]
      }
    }
  },
  filters: {
    formatDate(time) {
      let date = new Date(time)
      return formatDate(date, 'yyyy-MM-dd hh:mm')
    }
  },
  async created() {
    var result = await this.$BilibiliCommon.getHTTPResult(
      "https://b-helper.oss-cn-shanghai.aliyuncs.com/BLiveHelper/latest.yml",
      "",
      []
    )
    const doc = yaml.safeLoad(result.body)
    if (doc.version > this.$version) {
      this.dialogSet("update", this.$version, doc.version)
    }


    this.$store.watch((state) => state.roomInfo.danmakuList, async (newValue, oldValue) => {
      var danmaku = newValue[0]
      console.log('房间助手：弹幕状态变更')
      if (danmaku) {
        if (this.$store.state.TTSInfo.isTTS) {
          let result = this.$store.state.TTSInfo.TTSList.find(c => Number(c.userId) === danmaku.userId)
          var push = true
          if (result) {
            if (result.content == danmaku.content) {
              push = false
              result.num += danmaku.num
            }
          }
          if (push) {
            if (danmaku.isGift && this.$store.state.TTSInfo.TTSgift) {
              this.$store.state.TTSInfo.TTSList.push(danmaku)
            } else {
              this.$store.state.TTSInfo.TTSList.push(danmaku)
            }
          }
        }
      }
    }).bind(this)

    window.setInterval(this.loadRoom, 2 * 1000)
    this.processTTSQueue()
  },
  methods: {
    showSnackbar(content) {
      this.$store.state.snackbar.text = content
      this.$store.state.snackbar.show = true
    },
    processTTSQueue() {
      //Todo: 改成处理时候再拼装
      if (this.TTSTimer != null) {
        window.clearInterval(this.TTSTimer);
      }
      if (this.$store.state.TTSInfo.TTSList.length > 0) {
        console.log("处理TTS队列")
        var danmaku = this.$store.state.TTSInfo.TTSList.splice(0, 1)
        danmaku = danmaku[0]
        if (danmaku.isGift) {
          var text = this.getFormatedText(danmaku, this.$store.state.TTSInfo.TTSLang.onGift)
          var url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.$store.state.TTSInfo.TTSspeed + `&per=` + this.$store.state.TTSInfo.TTSperson + `&vol=` + this.$store.state.TTSInfo.TTSvolume + `&pit=` + this.$store.state.TTSInfo.TTSpitch + `&tex=` + encodeURI(text)
          var u = new Audio(url)
          u.src = url
          u.addEventListener('play', () => {
            setTimeout(() => {
              this.TTSTimer = window.setInterval(this.processTTSQueue, u.duration * 1000)
            }, 800)
          });
          u.play()
        } else {
          switch (danmaku.type) {
            case COMMAND_JOIN_ROOM:
              if (this.$store.state.TTSInfo.TTSLang.onJoin != "") {
                var text = this.getFormatedText(danmaku, this.$store.state.TTSInfo.TTSLang.onJoin)
                var url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.$store.state.TTSInfo.TTSspeed + `&per=` + this.$store.state.TTSInfo.TTSperson + `&vol=` + this.$store.state.TTSInfo.TTSvolume + `&pit=` + this.$store.state.TTSInfo.TTSpitch + `&tex=` + encodeURI(text)
                var u = new Audio(url)
                u.src = url
                u.addEventListener('play', () => {
                  setTimeout(() => {
                    this.TTSTimer = window.setInterval(this.processTTSQueue, u.duration * 1000)
                  }, 800)
                });
                u.play()
              }
              break
            case COMMAND_ADD_TEXT:
              if (this.$store.state.TTSInfo.TTSLang.onComment != "") {
                var text = this.getFormatedText(danmaku, this.$store.state.TTSInfo.TTSLang.onComment)
                var url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.$store.state.TTSInfo.TTSspeed + `&per=` + this.$store.state.TTSInfo.TTSperson + `&vol=` + this.$store.state.TTSInfo.TTSvolume + `&pit=` + this.$store.state.TTSInfo.TTSpitch + `&tex=` + encodeURI(text)
                var u = new Audio(url)
                u.src = url
                u.addEventListener('play', () => {
                  setTimeout(() => {
                    this.TTSTimer = window.setInterval(this.processTTSQueue, u.duration * 1000)
                  }, 800)
                });
                u.play()
              }
              break
            case COMMAND_ADD_FOLLOW:
              if (this.$store.state.TTSInfo.TTSLang.onFollow != "") {
                var text = this.getFormatedText(danmaku, this.$store.state.TTSInfo.TTSLang.onFollow)
                var url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.$store.state.TTSInfo.TTSspeed + `&per=` + this.$store.state.TTSInfo.TTSperson + `&vol=` + this.$store.state.TTSInfo.TTSvolume + `&pit=` + this.$store.state.TTSInfo.TTSpitch + `&tex=` + encodeURI(text)
                var u = new Audio(url)
                u.src = url
                u.addEventListener('play', () => {
                  setTimeout(() => {
                    this.TTSTimer = window.setInterval(this.processTTSQueue, u.duration * 1000)
                  }, 800)
                });
                u.play()
              }
              break
            case COMMAND_ADD_MEMBER:
              if (this.$store.state.TTSInfo.TTSLang.onGuard != "") {
                var text = this.getFormatedText(danmaku, this.$store.state.TTSInfo.TTSLang.onGuard)
                var url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.$store.state.TTSInfo.TTSspeed + `&per=` + this.$store.state.TTSInfo.TTSperson + `&vol=` + this.$store.state.TTSInfo.TTSvolume + `&pit=` + this.$store.state.TTSInfo.TTSpitch + `&tex=` + encodeURI(text)
                var u = new Audio(url)
                u.src = url
                u.addEventListener('play', () => {
                  setTimeout(() => {
                    this.TTSTimer = window.setInterval(this.processTTSQueue, u.duration * 1000)
                  }, 800)
                });
                u.play()
              }
              break
            case COMMAND_ADD_SUPER_CHAT:
              if (this.$store.state.TTSInfo.TTSLang.onSuperChat != "") {
                var text = this.getFormatedText(danmaku, this.$store.state.TTSInfo.TTSLang.onSuperChat)
                var url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.$store.state.TTSInfo.TTSspeed + `&per=` + this.$store.state.TTSInfo.TTSperson + `&vol=` + this.$store.state.TTSInfo.TTSvolume + `&pit=` + this.$store.state.TTSInfo.TTSpitch + `&tex=` + encodeURI(text)
                var u = new Audio(url)
                u.src = url
                u.addEventListener('play', () => {
                  setTimeout(() => {
                    this.TTSTimer = window.setInterval(this.processTTSQueue, u.duration * 1000)
                  }, 800)
                });
                u.play()
              }
              break
            case COMMAND_JOIN_ROOM_Guard:
              if (this.$store.state.TTSInfo.TTSLang.onJoinGuard != "") {
                var text = this.getFormatedText(danmaku, this.$store.state.TTSInfo.TTSLang.onJoinGuard)
                var url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.$store.state.TTSInfo.TTSspeed + `&per=` + this.$store.state.TTSInfo.TTSperson + `&vol=` + this.$store.state.TTSInfo.TTSvolume + `&pit=` + this.$store.state.TTSInfo.TTSpitch + `&tex=` + encodeURI(text)
                var u = new Audio(url)
                u.src = url
                u.addEventListener('play', () => {
                  setTimeout(() => {
                    this.TTSTimer = window.setInterval(this.processTTSQueue, u.duration * 1000)
                  }, 800)
                });
                u.play()
              }
              break

          }
        }
      } else {
        this.TTSTimer = window.setInterval(this.processTTSQueue, 0.5 * 1000)
      }
    },
    getFormatedText(danmaku, text) {
      return text.replace(/%s/g, danmaku.nickname).replace(/%n/g, danmaku.num).replace(/%v/g, danmaku.content)
    },
    dialogSet(action, username, userid) {
      switch (action) {
        case "update":
          this.dialogText = "是否更新版本"
          break
      }
      this.dialogUserName = username
      this.dialogUserId = userid
      this.dialogAction = action
      this.dialogShow = true
    },
    async dialogRun() {
      switch (this.dialogAction) {
        case "update":
          var result = await this.$BilibiliCommon.getHTTPResult(
            "https://b-helper.oss-cn-shanghai.aliyuncs.com/BLiveHelper/latest.yml",
            "",
            []
          )
          const doc = yaml.safeLoad(result.body)
          shell.openExternal("https://b-helper.oss-cn-shanghai.aliyuncs.com/BLiveHelper/" + doc.path)
          break
      }
      this.dialogClose()
    },
    dialogClose() {
      this.dialogShow = false
      this.dialogText = ""
      this.dialogUserName = ""
      this.dialogUserId = ""
      this.dialogAction = ""
    },
    sortByAmount(prop) {
      return function (a, b) {
        var value1 = a[prop]
        var value2 = b[prop]
        return value2 - value1
      }
    },
    switchDanmakuHime() {
      if (this.danmakuWindow == null) {
        this.$BilibiliCommon.saveNewData(this)
        const winUrl = process.env.NODE_ENV === 'development' ? `http://localhost:8080/danmakuHime` : `file://${__dirname}/danmakuHime.html/`;
        this.danmakuWindow = new remote.BrowserWindow({
          titleBarStyle: 'hidden',
          frame: false,
          width: 400,
          height: 600,
          transparent: true,
          webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            enableRemoteModule: true,
            webviewTag: true
          }
        })
        //this.danmakuWindow.webContents.openDevTools()
        this.danmakuWindow.on('closed', () => { this.danmakuWindow = null })
        this.danmakuWindow.loadURL(winUrl)
        this.danmakuWindow.setAlwaysOnTop(true);
      } else {
        this.danmakuWindow.close()
        this.danmakuWindow = null
      }
    },
    clearDanmakuList() {
      this.$store.state.roomInfo.danmakuList = []
    }
  }
}
</script>
