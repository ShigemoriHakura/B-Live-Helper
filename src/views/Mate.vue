<template>
  <div class="about">
    <v-container style="max-width: 100%!important;">
      <v-tabs>
        <v-tab>
          首页
        </v-tab>
        <v-tab>
          互动投票
        </v-tab>
        <v-tab>
          弹幕抽奖
        </v-tab>
        <v-tab>
          弹幕点歌
        </v-tab>
        <v-tab-item>
          请在登录后开播使用，如果有其他需求，请联系作者。
          <v-img height="650px" src="@/assets/img/neko.png"></v-img>
        </v-tab-item>
        <v-tab-item>
          <DanmakuVote />
        </v-tab-item>
        <v-tab-item>
          <DanmakuDraw />
        </v-tab-item>
        <v-tab-item>
          <DanmakuSong />
        </v-tab-item>
      </v-tabs>
    </v-container>
  </div>
</template>

<script>
import { formatDate } from '@/utils/timeFormat'
import DanmakuVote from '@/components/Mate/DanmakuVote.vue'
import DanmakuDraw from '@/components/Mate/DanmakuDraw.vue'
import DanmakuSong from '@/components/Mate/DanmakuSong.vue'

export default {
  data() {
    return {
    }
  },
  components: {
    DanmakuVote,
    DanmakuDraw,
    DanmakuSong,
  },
  filters: {
    formatDate(time) {
      let date = new Date(time)
      return formatDate(date, 'yyyy-MM-dd hh:mm')
    }
  },
  created() {
  },
  methods: {
  }
}
</script>