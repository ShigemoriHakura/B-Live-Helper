<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-chip>弹幕监听状态: {{getStatus(isStarted)}}</v-chip><br><br>
        选择礼物后请记得切换参与方式！<br>
        <v-text-field v-model="drawText" label="抽奖文本"></v-text-field>
        <v-text-field v-model="drawAmount" type="number" label="抽奖个数"></v-text-field>
        <v-select v-model="drawText" :items="availableGifts" label="快速选择礼物" item-text="gift_name"
          item-value="gift_name">
        </v-select>
        <v-switch v-model="isGift" :label="`参与本次抽奖方式: ${getIsGiftStatus}`"></v-switch>
        <v-btn class="ma-2" elevation="2" color="primary" @click="isStarted = true">开始</v-btn>
        <v-btn class="ma-2" elevation="2" color="error" @click="isStarted = false">结束</v-btn>
        <v-btn class="ma-2" elevation="2" color="warning" @click="getResult">抽奖</v-btn>
        <v-btn class="ma-2" elevation="2" @click="cleanTable">清空</v-btn>
      </v-col>
      <v-col cols="12" md="5">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">
                  发送者
                </th>
                <th class="text-left">
                  UID
                </th>
                <th class="text-left">
                  发送次数
                </th>
                <th class="text-left">
                  弹幕内容
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in drawDanmaku" :key="item.name">
                <td>{{ item.nickname }}</td>
                <td>{{ item.userId }}</td>
                <td>{{ item.num }}</td>
                <td>{{ item.content }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-col>
      <v-col cols="12" md="3">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">
                  中奖者
                </th>
                <th class="text-left">
                  ID
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in drawResult" :key="item.name">
                <td>{{ item.nickname }}</td>
                <td>{{ item.userId }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DanmakuDraw',
  data() {
    return {
      isStarted: false,
      isGift: false,

      drawDanmaku: [],
      drawText: "",
      drawAmount: 1,
      availableGifts: [],

      drawResult: [],
    }
  },
  async created() {
    const url = `https://acmate.loli.ren/api/gifts`
    var datagifts = (await axios.get(url)).data
    this.availableGifts = datagifts.data

    this.$store.watch((state) => state.roomInfo.danmakuList, async (newValue, oldValue) => {
      var danmaku = newValue[0]
      console.log('助手组件：弹幕抽奖：弹幕状态变更')
      if (this.isStarted && danmaku.isGift == this.isGift && danmaku.content == this.drawText) {
        let result = this.drawDanmaku.find(c => Number(c.userId) === danmaku.userId)
        if (result) {
          result.num += danmaku.num
        } else {
          this.drawDanmaku.push(danmaku)
        }
      }
    }).bind(this)
  },
  computed: {
    getIsGiftStatus() {
      if (this.isGift) {
        return "赠送礼物"
      }
      return "发送弹幕"
    }
  },
  methods: {
    getStatus(status) {
      if (status) {
        return "已开始"
      }
      return "已停止"
    },
    getResult() {
      this.isStarted = false
      this.drawResult = this.makeRandomArr(this.drawDanmaku, this.drawAmount)
    },
    makeRandomArr(arrList, num) {
      if (num > arrList.length) {
        return;
      }
      var tempArr = arrList.slice(0);
      var newArrList = [];
      for (var i = 0; i < num; i++) {
        var random = Math.floor(Math.random() * (tempArr.length));
        var arr = tempArr[random];
        tempArr.splice(random, 1);
        newArrList.push(arr);
      }
      return newArrList;
    },
    cleanTable() {
      this.isStarted = false
      this.drawDanmaku = []
      this.drawResult = []
    }
  }
}
</script>