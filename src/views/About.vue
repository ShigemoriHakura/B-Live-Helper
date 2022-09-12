<template>
  <div class="about">
    <v-container style="max-width: 100%!important;">
      <h1>感谢使用</h1>
      <h1>作者：<a @click="openExternal(1930322)">茂森白咲</a></h1>
      <h1>本项目的发展离不开各位的投喂，</h1>
      <h1>以下是投喂过的老板列表（排名不分先后）：</h1>
    </v-container>
    <v-container style="max-width: 100%!important;">
      <h1>当前代理列表：</h1>
      <v-simple-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">
                原始地址
              </th>
              <th class="text-left">
                反代地址
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item, index in MyProxy">
              <td>{{ index }}</td>
              <td>{{ item }}</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-container>
  </div>
</template>

<script>
import { MyProxy } from '@/MyProxy'
import { shell } from 'electron'
export default {
  data() {
    return {
      MyProxy
    }
  },
  methods: {
    openExternal(userId) {
      shell.openExternal("https://space.bilibili.com/" + userId)
    }
  }
}
</script>