<template>
  <div class="account">
    <v-container style="max-width: 100% !important">
      <v-container v-if="$store.state.config.isLogin" style="max-width: 100% !important">
        <v-row>
          <v-col cols="12" md="12">
            Bilibili直播助手版本：{{$version}}
          </v-col>
          <v-col cols="12" md="6">
            欢迎你，{{$store.state.BilibiliCommonCache.userName}}（UID：{{$store.state.BilibiliCommonCache.userId}}）
          </v-col>
          <v-col cols="12" md="6">
            <v-btn class="ma-2" elevation="2" color="error" @click="logoutAccunt">登出</v-btn>
          </v-col>
        </v-row>
      </v-container>
      <v-container v-if="!$store.state.config.isLogin" style="max-width: 100%!important;">
        扫码登录Bilibili账号
        <div>
          <qrcode :value="qrcodeUrl" :options="{ width: 400 }"></qrcode>
        </div>
      </v-container>
    </v-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data: () => ({
    qrcodeUrl: "Hello World",

    loginData: {},

    fetchLoginStatus: false,
    fetchLoginStatusTimer: null
  }),
  beforeDestroy() {
    this.fetchLoginStatus = false
    window.clearInterval(this.fetchLoginStatusTimer)
  },
  async created() {
    if (!this.$store.state.config.isLogin) {
      this.reloadAccount()
    }
  },
  methods: {
    //登录主站，只有一个地方需要所以就丢这里了
    async fetchLogin() {
      var res = await this.$BilibiliCommon.postHTTPResult(
        "https://passport.bilibili.com/qrcode/getLoginInfo",
        "https://passport.bilibili.com/login",
        {},
        {
          oauthKey: this.loginData.data.oauthKey
        }
      )
      //console.log(res)
      var resJson = JSON.parse(res.body)
      console.log(resJson)
      if (resJson.status == true) {
        this.fetchLoginStatus = false
        clearTimeout(this.fetchLoginStatusTimer)
        this.$store.state.BilibiliCommonCache.cookies = res.headers["set-cookie"]
        var res = await this.$BilibiliCommon.getHTTPResult(
          "http://api.bilibili.com/x/web-interface/nav",
          "",
          this.$store.state.BilibiliCommonCache.cookies
        )
        var resJson = JSON.parse(res.body)
        if (resJson.code == 0 && resJson.data.isLogin == true) {
          this.$BilibiliCommon.saveNewData(this)
          this.$store.state.BilibiliCommonCache.userName = resJson.data.uname
          this.$store.state.BilibiliCommonCache.userId = resJson.data.mid
          this.$store.state.config.isLogin = true
        }
      } else {
        console.log(resJson.message)
        if (this.fetchLoginStatus) {
          this.fetchLoginStatusTimer = setTimeout(this.fetchLogin, 1000)
        }
      }
    },
    logoutAccunt() {
      this.$store.state.config.isLogin = false
      this.$store.state.BilibiliCommonCache.cookies = {}
      this.$BilibiliCommon.saveNewData(this)
      window.clearInterval(this.fetchLoginStatusTimer)
      this.reloadAccount()
    },
    async reloadAccount() {
      var data = await axios.get("https://passport.bilibili.com/qrcode/getLoginUrl")
      console.log(data.data)
      if (data.data.code == 0) {
        this.qrcodeUrl = data.data.data.url
        this.fetchLoginStatus = true
        this.loginData = data.data
        this.fetchLogin()
      }
    }
  }
}
</script>