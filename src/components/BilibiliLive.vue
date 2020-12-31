<template>
  <v-container style="max-width: 100% !important">

  </v-container>
</template>

<script>
import eConfig from "electron-config"
import cookie from "cookie"
import got from "got"
import axios from 'axios'
import OBSWebSocket from 'obs-websocket-js'
import { shell } from 'electron'
import { formatDate } from '@/utils/timeFormat'

const econfig = new eConfig()
let Base64 = require("js-base64").Base64

export default {
  name: "BilibiliLive",
  data: () => ({
    categoryId: 4,
    concreteId: 402,
    //大分区
    category: [],
    //子分区
    concrete: [],
    //总数组
    categoryConcrete: [],
    getLiveStatusTimer: 0,

    //开播按钮等待
    isStarting: false,
    //关播按钮等待
    isClosing: false,
    //获取转码信息
    getTranscodeInfoTimer: 0,
  }),
  async created() {

  },
  watch: {
    categoryId: {
      handler(val) {
        //this.concrete = this.categoryConcrete[val]
      },
    },
  },
  filters: {
    formatDate(time) {
      let date = new Date(time)
      return formatDate(date, 'yyyy-MM-dd hh:mm')
    },
    getPhotoType(type) {
      switch (type) {
        case "Normal":
          return "图片"
        case "Gif":
          return "GIF"
      }
    }
  },
  beforeDestroy() {
    window.clearInterval(this.getLiveStatusTimer)
    window.clearInterval(this.getTranscodeInfoTimer)
  },
  methods: {
    getCover() {
      if (this.$store.state.liveInfo.useGifCover && this.$store.state.liveInfo.liveCoverGif != null && this.$store.state.liveInfo.liveCoverGif != undefined) {
        return this.$store.state.liveInfo.liveCoverGif
      }
      return this.$store.state.liveInfo.liveCover
    },
    testOBSWS() {
      if (this.$store.state.obsInfo.obsPort != 0 && this.$store.state.obsInfo.obsPort != undefined) {
        const obs = new OBSWebSocket()
        obs.connect({ address: 'localhost:' + this.$store.state.obsInfo.obsPort, password: this.$store.state.obsInfo.obsPass })
          .then(() => {
            obs.send('SetStreamSettings', {
              'type': "rtmp_custom",
              settings: {
                server: this.$store.state.liveInfo.liveStreamUrl,
                key: this.$store.state.liveInfo.liveStreamKey,
                use_auth: false,
              },
              save: true
            }).then(() => {
              this.$store.state.obsInfo.obsEnabled = true
              this.$BilibiliCommon.saveNewData(this)
              this.showSnackbar("链接成功，已经启动OBS控制")
            }).catch(err => {
              this.showSnackbar("写入OBS失败：" + err.error)
            }).bind(this)
            obs.disconnect()
          })
          .catch(err => {
            this.showSnackbar("连接OBS失败：" + err.error)
          })
      } else {
        this.showSnackbar("请好好填写OBS控制端口")
      }
    },
    writeOBSWS() {
      if (this.$store.state.obsInfo.obsEnabled) {
        const obs = new OBSWebSocket()
        obs.connect({ address: 'localhost:' + this.$store.state.obsInfo.obsPort, password: this.$store.state.obsInfo.obsPass })
          .then(() => {
            obs.send('SetStreamSettings', {
              'type': "rtmp_custom",
              settings: {
                server: this.$store.state.liveInfo.liveStreamUrl,
                key: this.$store.state.liveInfo.liveStreamKey,
                use_auth: false,
              },
              save: true
            }).then(() => {
              this.showSnackbar("写入OBS成功")
            }).catch(err => {
              this.showSnackbar("写入OBS失败：" + err.error)
            }).bind(this)
            obs.disconnect()
          })
          .catch(err => {
            this.showSnackbar("连接OBS失败：" + err.error)
          })
      }
    },
    startOBSWSStreaming() {
      if (this.$store.state.obsInfo.obsEnabled) {
        const obs = new OBSWebSocket()
        obs.connect({ address: 'localhost:' + this.$store.state.obsInfo.obsPort, password: this.$store.state.obsInfo.obsPass })
          .then(() => {
            obs.send('StartStreaming').then(() => {
              this.showSnackbar("开始推流成功")
            }).catch(err => {
              this.showSnackbar("开始推流失败：" + err.error)
            }).bind(this)
            obs.disconnect()
          })
          .catch(err => {
            this.showSnackbar("连接OBS失败：" + err.error)
          })
      }
    },
    stopOBSWSStreaming() {
      if (this.$store.state.obsInfo.obsEnabled) {
        const obs = new OBSWebSocket()
        obs.connect({ address: 'localhost:' + this.$store.state.obsInfo.obsPort, password: this.$store.state.obsInfo.obsPass })
          .then(() => {
            obs.send('StopStreaming').then(() => {
              this.showSnackbar("停止推流成功")
            }).catch(err => {
              this.showSnackbar("停止推流失败：" + err.error)
            }).bind(this)
            obs.disconnect()
          })
          .catch(err => {
            this.showSnackbar("连接OBS失败：" + err.error)
          })
      }
    },
    resetOBSWS() {
      this.$store.state.obsInfo.obsEnabled = false
      this.$BilibiliCommon.saveNewData(this)
      this.showSnackbar("关闭成功")
    },
    showSnackbar(content) {
      this.$store.state.snackbar.text = content
      this.$store.state.snackbar.show = true
    },
    downloadOBSWS() {
      shell.openExternal("https://acfun-helper.oss-cn-shanghai.aliyuncs.com/ACLiveHelper/OBS/obs-websocket-4.8.0-Windows-Installer.exe")
    },
    saveToCache(type) {
      switch (type) {
        case "Normal":
          if (this.$store.state.liveInfo.liveCover != null && this.$store.state.liveInfo.liveCover != undefined) {
            this.$store.state.liveInfo.cacheCovers.push({
              type: "Normal",
              uniqueId: this.GenGuid(),
              timestamp: Date.now(),
              cover: this.$store.state.liveInfo.liveCover
            })
            this.$BilibiliCommon.saveNewData(this)
            this.showSnackbar("保存成功")
          } else {
            this.showSnackbar("请先设置图片")
          }
          break
        case "Gif":
          if (this.$store.state.liveInfo.liveCoverGif != null && this.$store.state.liveInfo.liveCoverGif != undefined) {
            this.$store.state.liveInfo.cacheCovers.push({
              type: "Gif",
              uniqueId: this.GenGuid(),
              timestamp: Date.now(),
              cover: this.$store.state.liveInfo.liveCoverGif
            })
            this.$BilibiliCommon.saveNewData(this)
            this.showSnackbar("保存成功")
          } else {
            this.showSnackbar("请先设置图片")
          }
          break
      }
    },
    useFromCache(uniqueId) {
      for (let i = 0; i < this.$store.state.liveInfo.cacheCovers.length; i++) {
        const element = this.$store.state.liveInfo.cacheCovers[i];
        if (element.uniqueId == uniqueId) {
          switch (element.type) {
            case "Normal":
              this.$store.state.liveInfo.liveCover = element.cover
              break
            case "Gif":
              this.$store.state.liveInfo.liveCoverGif = element.cover
              break
          }
        }
      }
      this.showSnackbar("使用成功")
    },
    removeFromCache(uniqueId) {
      for (let i = 0; i < this.$store.state.liveInfo.cacheCovers.length; i++) {
        const element = this.$store.state.liveInfo.cacheCovers[i];
        if (element.uniqueId == uniqueId) {
          this.$store.state.liveInfo.cacheCovers.splice(i, 1)
        }
      }
      this.$BilibiliCommon.saveNewData(this)
      this.showSnackbar("删除成功")
    }
  },
};
</script>