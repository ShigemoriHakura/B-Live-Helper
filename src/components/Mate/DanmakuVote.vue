<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-chip>弹幕监听状态: {{getStatus(isStarted)}}</v-chip><br><br>
        选择礼物后请记得切换参与方式！<br>
        请注意，一个自然用户只有一票。<br>
        礼物投票时，一个礼物算作一票。<br>
        <v-text-field v-model="voteText" label="弹幕文本"></v-text-field>
        <v-text-field v-model="voteTarget" label="投票内容"></v-text-field>
        <v-select v-model="voteText" :items="availableGifts" label="快速选择礼物" item-text="gift_name"
          item-value="gift_name">
        </v-select>
        <v-switch v-model="isGift" :label="`参与本次投票方式: ${getIsGiftStatus}`"></v-switch>
        <v-btn class="ma-2" elevation="2" color="success" @click="addTarget">添加</v-btn>
        <v-btn class="ma-2" elevation="2" color="primary" @click="isStarted = true">开始</v-btn>
        <v-btn class="ma-2" elevation="2" color="error" @click="isStarted = false">结束</v-btn>
        <v-btn class="ma-2" elevation="2" @click="cleanTable">清空</v-btn>
      </v-col>
      <v-col cols="12" md="8">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">
                  投票内容
                </th>
                <th class="text-left">
                  参与方式
                </th>
                <th class="text-left">
                  具体内容
                </th>
                <th class="text-left">
                  投票数量
                </th>
                <th class="text-left">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in voteTargetList" :key="item.voteTarget">
                <td>{{ item.voteTarget }}</td>
                <td>{{ getIsGift(item.isGift) }}</td>
                <td>{{ item.voteText }}</td>
                <td>{{ item.num }}</td>
                <td>
                  <v-btn class="ma-2" elevation="2" color="warning" @click="delTarget(item.voteText)">删除</v-btn>
                </td>
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
  name: 'DanmakuVote',
  data() {
    return {
      isStarted: false,
      isGift: false,
      availableGifts: [],

      voteText: "",
      voteTarget: "",
      //目标列表
      voteTargetList: [],

      //已投用户
      votedUser: [],
    }
  },
  async created() {

    const url = `https://acmate.loli.ren/api/gifts`
    var datagifts = (await axios.get(url)).data
    this.availableGifts = datagifts.data

    this.$store.watch((state) => state.roomInfo.danmakuList, async (newValue, oldValue) => {
      var danmaku = newValue[0]
      console.log('助手组件：互动投票：弹幕状态变更')
      if (this.isStarted) {
        let result = this.voteTargetList.find(c => String(c.voteText) === danmaku.content)
        if (result && danmaku.isGift == result.isGift) {
          if (result.isGift) {
            result.num += danmaku.num
          } else {
            let result1 = this.votedUser.find(c => Number(c.userId) === danmaku.userId)
            if (!result1) {
              result.num += 1
              this.votedUser.push(danmaku)
            }
          }
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
    getIsGift(status) {
      if (status) {
        return "赠送礼物"
      }
      return "发送弹幕"
    },
    addTarget() {
      if (this.voteText != "" && this.voteTarget != "") {
        let result = this.voteTargetList.find(c => String(c.voteText) === this.voteText)
        let result1 = this.voteTargetList.find(c => String(c.voteTarget) === this.voteTarget)
        if (!result && !result1) {
          this.voteTargetList.unshift(
            {
              voteText: this.voteText,
              voteTarget: this.voteTarget,
              isGift: this.isGift,
              num: 0,
            }
          )
        } else {
          this.$store.state.snackbar.text = "已存在同内容或目标投票"
          this.$store.state.snackbar.show = true
        }
      } else {
        this.$store.state.snackbar.text = "请好好输入目标和内容"
        this.$store.state.snackbar.show = true
      }
    },
    delTarget(voteText) {
      let result = this.voteTargetList.find(c => String(c.voteText) === voteText)
      if (result) {
        this.voteTargetList.splice(result, 1)
      }
    },
    cleanTable() {
      this.isStarted = false
      this.voteTargetList = []
    }
  }
}
</script>