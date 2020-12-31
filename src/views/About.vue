<template>
  <div class="about">
    <v-container style="max-width: 100%!important;">
      <h1>感谢使用</h1>
      <h1>作者：<a @click="openExternal(1930322)">茂森白咲</a></h1>
      <h1>本项目的发展离不开各位的投喂，</h1>
      <h1>以下是投喂过的老板列表（排名不分先后）：</h1>
    </v-container>
  </div>
</template>

<script>
import { shell } from 'electron'
export default {
  data() {
    return {
    }
  },
  methods: {
    openExternal(userId) {
      shell.openExternal("https://space.bilibili.com/" + userId)
    }
  }
}
</script>