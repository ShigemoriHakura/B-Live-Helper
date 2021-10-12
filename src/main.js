import Vue from 'vue'
import App from './App.vue'
import BilibiliCommon from './BilibiliCommon.vue'
import './registerServiceWorker'
import router from './router'
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'
import Vuex from 'vuex'
import VueQrcode from '@chenfengyuan/vue-qrcode';

Vue.config.productionTip = false
import VImageInput from 'vuetify-image-input/a-la-carte';
import VueClipboard from 'vue-clipboard2'

Vue.component("v-image-input", VImageInput);
Vue.component(VueQrcode.name, VueQrcode);
VueClipboard.config.autoSetContainer = true
Vue.use(VueClipboard)
Vue.use(Vuex)


Vue.prototype.$version = "0.1.4"
Vue.prototype.$BilibiliCommon = BilibiliCommon

const store = new Vuex.Store({
  state: {
    config: {
      isLogin: false,
    },
    //B站登录的缓存
    BilibiliCommonCache: {
      userName: "",
      userId: "",
      cookies: {}
    },
    TTSInfo: {
      isTTS: false,
      TTSList: [],
      TTSspeed: 6,
      TTSpitch: 6,
      TTSvolume: 6,
      TTSperson: 0,
      TTSgift: true,
      TTSLang: {
        onComment: "%s 说 %v",
        onGift: "感谢 %s 送的 %n 个 %v",
        onJoin: "欢迎 %s 来到直播间",
        onFollow: "感谢 %s 的关注",
        onGuard: "感谢 %s 的 %v",
        onSuperChat: "感谢 %s 的留言 %v",
        onJoinGuard: "欢迎舰长 %s 来到直播间",
      },
    },
    roomInfo: {
      roomId: 0,
      danmakuList: []
    },
    liveInfo: {
      isLive: false,
      liveTitle: "",
      liveStreamUrl: "",
      liveStreamKey: "",
      liveCategoryId: 0,
      liveConcreteId: 0,
      cacheCovers: [],
    },
    liveCoverCache: {
      liveCover: "",
    },
    obsInfo: {
      obsPort: 4444,
      obsPass: "",
      obsEnabled: false,
      obsStartStreamingAfterStart: false,
      obsStopStreamingAfterClose: false,
    },
    logList: [],
    snackbar: {
      text: "(/=-=)/",
      show: false,
    },
  },
  mutations: {
    addLog(state, content) {
      state.logList.unshift({
        logTime: Date.now(),
        logContent: content,
      })
    }
  }
})


new Vue({
  store: store,
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
