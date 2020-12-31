<template>
  <div class="danmakuHime" style="overflow: hidden;background-color: rgba(0, 0, 0, 0);">
    <div class="window-chrome" id="window-chrome">
      <div class="app-label">置顶浏览器</div>
      <div class="window-controls">
        <div class="close" @click="closeWindow"><img src="@/assets/ui/close.png" /></div>
      </div>
    </div>

    <div class="app-controls" id="app-controls">
      <input type="range" v-model="opacity" value="0.95" min="0.2" max="1" step="0.05" id="transparencyRange" />
      <button @click="enableClickThrough" id="clickthroughButton"><img src="@/assets/ui/eye.png" /></button>
    </div>

    <webview id="browserView" src="_blank"
      style="background-color: rgba(0, 0, 0, 0)!important;display:inline-flex; width:100%;"></webview>
  </div>
</template>

<script>
import eConfig from "electron-config"
import got from "got"
import { remote } from 'electron'
const econfig = new eConfig()

export default {
  name: 'danmakuHime',
  data: () => ({
    opacity: 0.95,
  }),
  mounted() {
    window.addEventListener('load', () => {
      this.loadPage("https://chat.bilisc.com/room/" + econfig.get("config.roomId") + "?minGiftPrice=0&exchangeRate=1&showDanmaku=true&showEqualMedal=false&showFollow=true&followText=%E5%85%B3%E6%B3%A8%E4%BA%86%E4%B8%BB%E6%92%AD&showJoin=true&joinText=%E8%BF%9B%E5%85%A5%E4%BA%86%E7%9B%B4%E6%92%AD%E9%97%B4&showQuit=false&quitText=%E7%A6%BB%E5%BC%80%E4%BA%86%E7%9B%B4%E6%92%AD%E9%97%B4&showLove=true&loveText=%E7%82%B9%E4%BA%AE%E7%88%B1%E5%BF%83&showJoinGroup=true&joinGroupText=%E5%8A%A0%E5%85%A5%E4%BA%86%E5%AE%88%E6%8A%A4%E5%9B%A2&showGift=true&showGiftPrice=true&showACCoinInstead=true&showGiftPngInstead=false&showGiftName=true&mergeSimilarDanmaku=true&mergeSimilarOther=true&mergeGift=true&maxNumber=60&blockGiftDanmaku=false&blockKeywords=&blockUsers=&blockMedalLevel=0&autoTranslate=false")
    })
  },
  methods: {
    async loadPage(url) {
      console.log("Loading " + url);
      var webview = document.getElementById('browserView')
      const res = await got("https://b-helper.oss-cn-shanghai.aliyuncs.com/BLiveHelper/css/danmakuStyle.css", {
        method: "GET",
      })
      webview.addEventListener('dom-ready', function () {
        webview.insertCSS(res.body);
      })
      webview.loadURL(url);
    },
    closeWindow() {
      var window = remote.getCurrentWindow()
      window.close()
    },
    enableClickThrough() {
      console.log("Clickthrough enabled.")
      var window = remote.getCurrentWindow()
      window.setIgnoreMouseEvents(true);
      document.getElementById('browserView').classList.add("full-size")
      document.getElementById('window-chrome').style.height = 0;
      document.getElementById('app-controls').style.display = "none";
    },
    disableClickThrough() {
      console.log("Clickthrough disabled.")
      var window = remote.getCurrentWindow()
      window.setIgnoreMouseEvents(false)
      document.getElementById('browserView').classList.del("full-size")
      document.getElementById('window-chrome').style.height = 200;
      document.getElementById('app-controls').style.display = "flex";
    }
  },
  watch: {
    opacity() {
      document.getElementById('browserView').style["opacity"] = this.opacity
    }
  }
}

</script>

<style src="@/assets/css/app.css"></style>