<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-chip>弹幕监听状态: {{getStatus(isStarted)}}</v-chip>
        <v-chip>发送弹幕格式: {{addText}} 歌名</v-chip>
        <br><br>
        <v-text-field v-model="addText" label="点歌指令"></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-btn class="ma-2" elevation="2" color="primary" @click="isStarted = true">开始</v-btn>
        <v-btn class="ma-2" elevation="2" color="error" @click="isStarted = false">结束</v-btn>
        <v-btn class="ma-2" elevation="2" @click="cleanTable">清空歌曲</v-btn>
      </v-col>
      <v-col cols="12" md="8">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">
                  发送者
                </th>
                <th class="text-left">
                  发送次数
                </th>
                <th class="text-left">
                  歌名
                </th>
                <th class="text-left">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in addList" :key="item.timestamp">
                <td>{{ item.sender_name }}</td>
                <td>{{ item.num }}</td>
                <td>{{ item.song }}</td>
                <td>
                  <v-btn class="ma-2" elevation="2" color="primary" @click="moveSong(item.song)">已唱</v-btn>
                  <v-btn class="ma-2" elevation="2" color="primary" v-clipboard:copy="item.song"
                    v-clipboard:success="onCopy">复制</v-btn>
                  <v-btn class="ma-2" elevation="2" color="error" @click="deleteSong(item.song, false)">删除</v-btn>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-col>
      <v-col cols="12" md="4">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">
                  已唱歌曲
                </th>
                <th class="text-left">
                  点歌人
                </th>
                <th class="text-left">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dongList" :key="item.timestamp">
                <td>{{ item.song }}</td>
                <td>{{ item.sender_name }}</td>
                <td>
                  <v-btn elevation="2" color="error" @click="deleteSong(item.song, true)">删除</v-btn>
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

export default {
  name: 'DanmakuSong',
  data() {
    return {
      isStarted: true,

      addText: "点歌",
      //目标列表
      addList: [],

      //已唱歌曲
      dongList: [],
    }
  },
  async created() {
    this.$store.watch((state) => state.roomInfo.danmakuList, async (newValue, oldValue) => {
      var danmaku = newValue[0]
      console.log('助手组件：弹幕点歌：弹幕状态变更')
      if (this.isStarted) {
        if (danmaku.content.indexOf(this.addText) === 0) {
          var keyword = danmaku.content.split(" ").slice(1).join(" ")
          let result = this.addList.find(c => String(c.song) === keyword)
          if (!result && keyword != "") {
            this.addList.unshift(
              {
                timestamp: danmaku.time,
                sender_name: danmaku.nickname,
                sender_id: danmaku.userId,
                song: keyword,
                num: 1,
              }
            )
          } else {
            result.num += 1
          }
        }
      }
    }).bind(this)
  },
  methods: {
    onCopy: function () {
      this.$store.state.snackbar.text = "复制成功"
      this.$store.state.snackbar.show = true
    },
    getStatus(status) {
      if (status) {
        return "已开始"
      }
      return "已停止"
    },
    cleanTable() {
      this.isStarted = false
      this.addList = []
      this.dongList = []
    },
    moveSong(song) {
      for (let i = 0; i < this.addList.length; i++) {
        const element = this.addList[i];
        if (element.song === song) {
          var arr = this.addList[i];
          this.addList.splice(i, 1)
          this.dongList.push(arr)
        }
      }
    },
    deleteSong(song, isDone) {
      if (isDone) {
        for (let i = 0; i < this.dongList.length; i++) {
          const element = this.dongList[i];
          if (element.song === song) {
            this.dongList.splice(i, 1)
          }
        }
      } else {
        for (let i = 0; i < this.addList.length; i++) {
          const element = this.addList[i];
          if (element.song === song) {
            this.addList.splice(i, 1)
          }
        }
      }
    },
  }
}
</script>