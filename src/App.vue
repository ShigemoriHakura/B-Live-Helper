<template>
  <v-app id="inspire">
    <v-navigation-drawer permanent expand-on-hover app>
      <v-list nav>
        <v-list-item v-for="item in items" :key="item.title" :to="item.link" link v-show="getIsShow(item.needIsLogin)">
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <keep-alive>
        <router-view></router-view>
      </keep-alive>
      <v-snackbar v-model="$store.state.snackbar.show">
        {{ $store.state.snackbar.text }}
        <template v-slot:action="{ attrs }">
          <v-btn v-bind="attrs" color="pink" text @click="$store.state.snackbar.show = false">
            关闭
          </v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script>

import http from "http";
import { ipcRenderer } from 'electron';

const COMMAND_HEARTBEAT = 0
const COMMAND_JOIN_ROOM = 1
const COMMAND_ADD_TEXT = 2
const COMMAND_ADD_GIFT = 3
const COMMAND_ADD_FOLLOW = 10
const COMMAND_ADD_JOIN_GROUP = 11

export default {
  name: 'App',

  components: {
  },

  data() {
    return {
      items: [
        { title: '账号信息', icon: 'mdi-account-box', link: '/account', needIsLogin: false },
        { title: '房间助手', icon: 'mdi-view-dashboard', link: '/', needIsLogin: true },
        { title: '直播开播', icon: 'mdi-remote', link: '/live', needIsLogin: true },
        { title: '弹幕工具', icon: 'mdi-duck', link: '/mate', needIsLogin: true },
        { title: '主站工具', icon: 'mdi-clippy', link: '/fun', needIsLogin: false },
        { title: '操作日志', icon: 'mdi-history', link: '/log', needIsLogin: false },
        { title: '关于助手', icon: 'mdi-help-box', link: '/about', needIsLogin: false },
        { title: '更新日志', icon: 'mdi-cup', link: '/history', needIsLogin: false },
      ],
      right: null,

      //ws部分
      websocket: null,
      retryCount: 0,
      isDestroying: false,
      heartbeatTimerId: null
    }
  },
  beforeDestroy() {
    this.isDestroying = true
    if (this.websocket != null) {
      this.websocket.close()
    }
  },
  created() {
    //监听isLogin，判断登录状态
    this.$store.watch((state) => state.config.isLogin, async (newValue, oldValue) => {
      if (newValue == true) {
        await this.$BilibiliCommon.getLoginDataFromCookies(this)
        this.isDestroying = false
        await this.$BilibiliCommon.getRoomId(this)
        if (this.$store.state.roomInfo.roomId != 0) {
          this.$BilibiliCommon.saveRoomId(this)
          this.wsConnect()
        }
      } else {
        if (this.websocket != null) {
          this.isDestroying = true
          this.websocket.close()
        }
      }
      console.log('主APP：登录状态变更：' + oldValue + ' -> ' + newValue)
    }).bind(this)

    //拉缓存信息
    this.$BilibiliCommon.getSavedData(this)
    if (this.$store.state.BilibiliCommonCache.cookies !== [] && this.$store.state.BilibiliCommonCache.cookies !== undefined) {
      this.$store.state.config.isLogin = true
    }
  },
  methods: {
    getIsShow(status) {
      if (status && this.$store.state.config.isLogin) {
        return true
      } else if (!status) {
        return true
      }
      return false
    },
    wsConnect() {
      //const url = `wss://danmaku.loli.ren/chat`
      const url = `ws://localhost:12451/chat`
      this.websocket = new WebSocket(url)
      this.websocket.onopen = this.onWsOpen
      this.websocket.onclose = this.onWsClose
      this.websocket.onmessage = this.onWsMessage
      this.heartbeatTimerId = window.setInterval(this.sendHeartbeat, 10 * 1000)
    },
    sendHeartbeat() {
      this.websocket.send(JSON.stringify({
        cmd: COMMAND_HEARTBEAT
      }))
    },
    onWsOpen() {
      this.retryCount = 0
      this.websocket.send(JSON.stringify({
        cmd: COMMAND_JOIN_ROOM,
        data: {
          roomId: parseInt(35119946),
          broomId: parseInt(this.$store.state.roomInfo.roomId),
          version: "9.9.9",
          config: {
            autoTranslate: false
          }
        }
      }))
    },
    onWsClose() {
      if (this.heartbeatTimerId) {
        window.clearInterval(this.heartbeatTimerId)
        this.heartbeatTimerId = null
      }
      if (this.isDestroying) {
        return
      }
      window.console.log(`掉线重连中: ${++this.retryCount}`)
      this.wsConnect()
    },
    onWsMessage(event) {
      let { cmd, data } = JSON.parse(event.data)
      //window.console.log(data)
      if (data) {
        if (data.id != 0) {
          switch (cmd) {
            case COMMAND_ADD_TEXT:
              this.pushToDanmaku(data.authorName, 1, data.userId, data.content, data.timestamp, false, COMMAND_ADD_TEXT, data.id)
              break
            case COMMAND_ADD_GIFT:
              this.pushToDanmaku(data.authorName, data.num, data.userId, data.giftName, data.timestamp, true, COMMAND_ADD_GIFT, data.id)
              break
            case COMMAND_ADD_FOLLOW:
              this.pushToTTS(data.authorName, 1, data.userId, data.content, data.timestamp, false, COMMAND_ADD_FOLLOW, data.id)
              break
            case COMMAND_JOIN_ROOM:
              this.pushToTTS(data.authorName, 1, data.userId, data.content, data.timestamp, false, COMMAND_JOIN_ROOM, data.id)
              break
            case COMMAND_ADD_JOIN_GROUP:
              this.pushToTTS(data.authorName, 1, data.userId, data.content, data.timestamp, false, COMMAND_ADD_JOIN_GROUP, data.id)
              break
          }
        }
      }
    },
    pushToDanmaku(name, num, uid, danmaku, timestamp, isGift, tid, id) {
      this.$store.state.roomInfo.danmakuList.unshift({
        nickname: name,
        userId: uid,
        content: danmaku,
        time: timestamp,
        isGift: isGift,
        num: num,
        uniqueId: Date.now() + id,
        type: tid
      })
    },
    pushToTTS(name, num, uid, danmaku, timestamp, isGift, tid, id) {
      if (this.$store.state.TTSInfo.isTTS) {
        this.$store.state.TTSInfo.TTSList.push({
          nickname: name,
          userId: uid,
          content: danmaku,
          time: timestamp,
          isGift: isGift,
          num: num,
          uniqueId: Date.now() + id,
          type: tid
        })
      }
    }
  }
}


</script>
