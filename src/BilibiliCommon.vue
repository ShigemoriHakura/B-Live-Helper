<script>
import eConfig from "electron-config"
import cookie from "cookie"
import got from "got"
import axios from 'axios'

const econfig = new eConfig()
const UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36"
let Base64 = require('js-base64').Base64

//主业务逻辑，处理全局登录等属性。
export default {
  //存储区逻辑
  //同步存储数据，经典的this和that！
  getSavedData(that) {
    that.$store.state.BilibiliCommonCache.cookies = econfig.get("BilibiliCommonCache.cookies")

    that.$store.state.obsInfo.obsPort = econfig.get("obsInfo.obsPort")
    that.$store.state.obsInfo.obsPass = econfig.get("obsInfo.obsPass")
    that.$store.state.obsInfo.obsEnabled = econfig.get("obsInfo.obsEnabled")
    that.$store.state.obsInfo.obsStopStreamingAfterClose = econfig.get("obsInfo.obsStopStreamingAfterClose")

    //读取TTS信息
    var TTS = econfig.get("config.TTSInfo")
    if (TTS != undefined) {
      that.$store.state.TTSInfo.isTTS = TTS.isTTS
      that.$store.state.TTSInfo.TTSspeed = TTS.TTSspeed
      that.$store.state.TTSInfo.TTSpitch = TTS.TTSpitch
      that.$store.state.TTSInfo.TTSvolume = TTS.TTSvolume
      that.$store.state.TTSInfo.TTSperson = TTS.TTSperson
      that.$store.state.TTSInfo.TTSgift = TTS.TTSgift
      if (TTS.TTSLang != undefined) {
        that.$store.state.TTSInfo.TTSLang = TTS.TTSLang
      }
    }

    that.$store.commit('addLog', "读取设置内容完成")
  },

  //全部数据保存
  saveNewData(that) {
    econfig.set("BilibiliCommonCache.cookies", that.$store.state.BilibiliCommonCache.cookies)

    //保存的房间ID，弹幕显示用

    econfig.set("obsInfo.obsPort", that.$store.state.obsInfo.obsPort)
    econfig.set("obsInfo.obsPass", that.$store.state.obsInfo.obsPass)
    econfig.set("obsInfo.obsEnabled", that.$store.state.obsInfo.obsEnabled)
    econfig.set("obsInfo.obsStopStreamingAfterClose", that.$store.state.obsInfo.obsStopStreamingAfterClose)

    that.$store.commit('addLog', "保存设置内容完成")
  },

  saveTTSData(that) {
    that.$store.state.TTSList = []
    //保存的房间ID，弹幕显示用
    econfig.set("config.TTSInfo", that.$store.state.TTSInfo)

    that.$store.commit('addLog', "保存TTS设置内容完成")
  },

  saveRoomId(that) {
    //保存的房间ID，弹幕显示用
    econfig.set("config.roomId", that.$store.state.roomInfo.roomId)

    that.$store.commit('addLog', "保存房间号设置内容完成")
  },

  //刷新登录区逻辑
  async getLoginDataFromCookies(that) {
    const res = await this.getHTTPResult(
      "http://api.bilibili.com/x/web-interface/nav",
      "",
      that.$store.state.BilibiliCommonCache.cookies
    )
    var resJson = JSON.parse(res.body)
    if (resJson.code == 0 && resJson.data.isLogin == true) {
      that.$store.state.BilibiliCommonCache.userName = resJson.data.uname
      that.$store.state.BilibiliCommonCache.userId = resJson.data.mid
      that.$store.state.config.isLogin = true
    } else {
      that.$store.state.config.isLogin = false
    }
  },

  async getRoomId(that) {
    const res = await this.getHTTPResult(
      "https://api.live.bilibili.com/live_user/v1/UserInfo/live_info",
      "",
      that.$store.state.BilibiliCommonCache.cookies
    )
    var resJson = JSON.parse(res.body)
    if (resJson.code == 0) {
      that.$store.state.roomInfo.roomId = resJson.data.roomid
    }
  },

  //不同请求有不同的referer和ua需求，这里统一封装方法。因为formdata有点问题所以多一个RawBody（Buffer）的方法
  async postHTTPResult(url, referer, cookies, form) {
    try {
      const res = await got(url, {
        method: "POST",
        headers: {
          Referer: referer,
          cookie: cookies,
          "user-agent": UserAgent,
        },
        form: form,
      })
      return res
    } catch (error) {
      return error.response
    }
  },
  async postHTTPRawBody(url, referer, cookies, contentType, body) {
    try {
      const res = await got(url, {
        method: "POST",
        headers: {
          Referer: referer,
          cookie: cookies,
          "content-type": contentType,
          "user-agent": UserAgent,
        },
        body: body,
      })
      return res
    } catch (error) {
      return error.response
    }
  },
  async getHTTPResult(url, referer, cookies) {
    try {
      const res = await got(url, {
        method: "GET",
        headers: {
          Referer: referer,
          cookie: cookies,
          "user-agent": UserAgent,
        },
      })
      return res
    } catch (error) {
      return error.response
    }
  },
}
</script>