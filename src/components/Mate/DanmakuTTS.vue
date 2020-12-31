<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-switch v-model="$store.state.TTSInfo.isTTS" :label="`播报开启: ${getStatus($store.state.TTSInfo.isTTS)}`">
        </v-switch>
        <v-btn class="ma-2" elevation="2" color="warning" @click="testTTS">测试TTS</v-btn>
        <v-btn class="ma-2" elevation="2" color="success" @click="saveSettings">保存</v-btn>
      </v-col>
      <v-col cols="12" md="8">
        <v-switch v-model="$store.state.TTSInfo.TTSgift" :label="`播报礼物: ${getStatus($store.state.TTSInfo.TTSgift)}`">
        </v-switch>
        <v-slider :label="`语速 ${$store.state.TTSInfo.TTSspeed}`" v-model="$store.state.TTSInfo.TTSspeed" step="1"
          min="1" max="15"></v-slider>
        <v-slider :label="`语调 ${$store.state.TTSInfo.TTSpitch}`" v-model="$store.state.TTSInfo.TTSpitch" step="1"
          min="1" max="15"></v-slider>
        <v-slider :label="`音量 ${$store.state.TTSInfo.TTSvolume}`" v-model="$store.state.TTSInfo.TTSvolume" step="1"
          min="1" max="15"></v-slider>
        <v-select v-model="$store.state.TTSInfo.TTSperson" :items="availableTTSPerson" label="音库" item-text="name"
          item-value="id">
        </v-select>
        <v-text-field v-model="$store.state.TTSInfo.TTSLang.onComment" placeholder="%s 说 %v" label="弹幕播报句式">
        </v-text-field>
        <v-text-field v-model="$store.state.TTSInfo.TTSLang.onGift" placeholder="感谢 %s 送的 %n 个 %v" label="礼物播报句式">
        </v-text-field>
        <v-text-field v-model="$store.state.TTSInfo.TTSLang.onJoin" placeholder="欢迎 %s 来到直播间" label="欢迎播报句式">
        </v-text-field>
        <v-text-field v-model="$store.state.TTSInfo.TTSLang.onFollow" placeholder="感谢 %s 的关注" label="关注播报句式">
        </v-text-field>
        %s: 发送者<br>
        %n: 礼物数量<br>
        %v: 赠送内容 <br>
        例子：感谢 %s 送的 %n 个 %v <br>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DanmakuTTS',
  data() {
    return {
      availableTTSPerson: [
        {
          name: "度小美",
          id: 0,
        }, {
          name: "度小宇",
          id: 1,
        }, {
          name: "度逍遥（基础）",
          id: 3,
        }, {
          name: "度逍遥（精品）",
          id: 5003,
        }, {
          name: "度丫丫",
          id: 4,
        }, {
          name: "度小鹿",
          id: 5118,
        }, {
          name: "度博文",
          id: 106,
        }, {
          name: "度小童",
          id: 110,
        }, {
          name: "度小萌",
          id: 111,
        }, {
          name: "度米朵",
          id: 103,
        }, {
          name: "度小娇",
          id: 5,
        }
      ]
    }
  },
  methods: {
    getStatus(status) {
      if (status) {
        return "已开始"
      }
      return "已停止"
    },
    testTTS() {
      var danmaku = "这是一个测试"
      this.$store.state.TTSInfo.TTSList.push({
        nickname: "测试",
        userId: 1,
        content: danmaku,
        time: Date.now(),
        isGift: false,
        num: 1,
        uniqueId: Date.now() + 1 + danmaku,
        type: 2,
      })
    },
    saveSettings() {
      this.$BilibiliCommon.saveTTSData(this)
      this.$store.state.snackbar.text = "保存成功"
      this.$store.state.snackbar.show = true
    }
  }
}
</script>