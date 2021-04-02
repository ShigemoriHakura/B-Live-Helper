<template>
  <v-container style="max-width: 100% !important">
    <v-container v-if="$store.state.config.isLogin" style="max-width: 100% !important">
      <v-container style="max-width: 100% !important">
        <v-tabs>
          <v-tab v-if="!$store.state.liveInfo.isLive">
            开播详情
          </v-tab>
          <v-tab v-if="$store.state.liveInfo.isLive">
            直播间详情
          </v-tab>
          <v-tab>
            直播间设置
          </v-tab>
          <v-tab>
            封面缓存
          </v-tab>
          <v-tab>
            封面设置
          </v-tab>
          <v-tab v-if="!$store.state.liveInfo.isLive">
            OBS控制
          </v-tab>
          <v-tab-item v-if="!$store.state.liveInfo.isLive">
            <v-row>
              <v-col cols="12" md="12">
                <v-select v-model="categoryId" :items="categoryConcrete" item-text="name" item-value="id" label="分区">
                </v-select>
                <v-select v-model="concreteId" :items="concrete" item-text="name" item-value="id" label="具体"></v-select>
                <v-btn class="ma-2" elevation="2" color="error" @click="startLive">开播</v-btn>
              </v-col>
            </v-row>
          </v-tab-item>
          <v-tab-item v-if="$store.state.liveInfo.isLive">
            <v-row>
              <v-col cols="12" md="12">
                <v-text-field v-model="$store.state.liveInfo.liveStreamUrl" type="text" label="推流地址" disabled>
                </v-text-field>
                <v-text-field v-model="$store.state.liveInfo.liveStreamKey" type="password" label="推流码" disabled>
                </v-text-field>
                <v-btn class="ma-2" elevation="2" color="warning" v-if="$store.state.obsInfo.obsEnabled"
                  @click="writeOBSWS">
                  写入OBS</v-btn>
                <v-btn class="ma-2" elevation="2" color="success" v-if="$store.state.obsInfo.obsEnabled"
                  @click="startOBSWSStreaming">
                  开始推流</v-btn>
                <v-btn class="ma-2" elevation="2" color="error" v-if="$store.state.obsInfo.obsEnabled"
                  @click="stopOBSWSStreaming">
                  停止推流</v-btn>
                <br>
                <v-btn class="ma-2" elevation="2" color="primary" v-clipboard:copy="$store.state.liveInfo.liveStreamUrl"
                  v-clipboard:success="onCopy">
                  复制地址</v-btn>
                <v-btn class="ma-2" elevation="2" color="primary" v-clipboard:copy="$store.state.liveInfo.liveStreamKey"
                  v-clipboard:success="onCopy">
                  复制推流码</v-btn>
                <v-btn class="ma-2" elevation="2" color="error" @click="stopLive">关播</v-btn>
                <br>
                <v-btn class="ma-2" elevation="2" color="primary" @click="delayStopPush">延迟关闭直播</v-btn>
                <v-btn class="ma-2" elevation="2" color="primary" v-clipboard:copy="livelink"
                  v-clipboard:success="onCopy">
                  复制直播间地址</v-btn>
              </v-col>
            </v-row>
          </v-tab-item>
          <v-tab-item>
            <v-row>
              <v-col cols="12" md="12">
                <v-text-field v-model="$store.state.liveInfo.liveTitle" type="text" label="直播标题"></v-text-field>
                <v-btn class="ma-2" elevation="2" color="error" @click="setTitle">设置标题</v-btn>

                <v-select v-model="picId" :items="coverList" item-text="id" item-value="id" label="直播间封面">
                </v-select>
                <v-btn class="ma-2" elevation="2" color="error" @click="replaceCover" v-if="picAvailable">设置封面</v-btn>
                <v-btn class="ma-2" elevation="2" color="primary" @click="getLiveCovers">刷新封面</v-btn>

                <v-img height="650px" :src="picUrl"></v-img>
              </v-col>
            </v-row>
          </v-tab-item>
          <v-tab-item>
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">
                      缓存时间
                    </th>
                    <th class="text-left">
                      类型
                    </th>
                    <th class="text-left">
                      图片
                    </th>
                    <th class="text-left">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in $store.state.liveInfo.cacheCovers" :key="item.uniqueId">
                    <td>{{ item.timestamp | formatDate  }}</td>
                    <td>{{ item.type | getPhotoType}}</td>
                    <td>
                      <v-img height="120px" width="200px" :src="item.cover"></v-img>
                    </td>
                    <td>
                      <v-btn class="ma-2" elevation="2" color="success" v-for="iitem in coverList" :key="iitem.id"
                        @click="useFromCache(item.uniqueId, iitem.id)">
                        替换封面 {{iitem.id}}
                      </v-btn>
                      <v-btn class="ma-2" elevation="2" color="error" @click="removeFromCache(item.uniqueId)">删除
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-tab-item>
          <v-tab-item>
            <v-row>
              <v-col cols="12" md="12">
                上传封面：
                <v-btn class="ma-2" @click="saveToCache(`Normal`)" elevation="2" color="success">保存至缓存</v-btn>
                <v-image-input v-model="$store.state.liveCoverCache.liveCover" :image-quality="0.25" clearable
                  image-format="jpeg" :imageHeight="264" :imageWidth="470" :fullWidth="true" :fullHeight="true"
                  :hideActions="false" />
              </v-col>
            </v-row>
          </v-tab-item>
          <v-tab-item v-if="!$store.state.liveInfo.isLive">
            <v-row>
              <v-col cols="12" md="12">
                请注意先打开OBS再打开助手<br>
                <v-text-field v-model="$store.state.obsInfo.obsPort" type="number" label="OBS控制端口"></v-text-field>
                <v-text-field v-model="$store.state.obsInfo.obsPass" type="text" label="OBS控制密码"></v-text-field>
                <v-switch v-model="$store.state.obsInfo.obsStartStreamingAfterStart"
                  label="开始直播时开始推流（请注意，开始直播后8秒才会自动开始推流）"></v-switch>
                <v-switch v-model="$store.state.obsInfo.obsStopStreamingAfterClose"
                  label="关闭直播时停止推流（请注意，关闭直播是立刻关闭的，而推流到用户的延迟有6-8秒，请注意自行计算延迟）"></v-switch>
                <v-btn class="ma-2" @click="testOBSWS" elevation="2" color="success">测试并开启</v-btn>
                <v-btn class="ma-2" @click="resetOBSWS" elevation="2" color="error">关闭此功能</v-btn>
              </v-col>
              <v-col cols="12" md="12">
                设置教程：<br>
                0.检查OBS版本是否大于25或以上<br>
                1.安装OBS控制插件（<v-btn class="ma-2" @click="downloadOBSWS" elevation="2" color="success">点我下载</v-btn>）<br>
                2.设置密码和端口，注意关闭“启用系统托盘通知”，不然会出现很多连接和断开的通知提醒。<br>
                3.将端口和密码写入上方对应栏目中<br>
                4.点击测试并开启<br>
                5.如果失败，请检查端口和密码等是否正确，端口是否堵塞等。<br>
                <br>
                <v-img width="272px" height="195px" src="@/assets/img/obs/P0.png"></v-img>
                <v-img width="458px" height="263px" src="@/assets/img/obs/P1.png"></v-img>
              </v-col>
            </v-row>
          </v-tab-item>
        </v-tabs>
      </v-container>
    </v-container>
    <v-container v-if="!$store.state.config.isLogin" style="max-width: 100%!important;">
      请先登录账号再使用本功能！
    </v-container>
  </v-container>
</template>

<script>
import eConfig from "electron-config"
import cookie from "cookie"
import got from "got"
import axios from 'axios'
import OBSWebSocket from 'obs-websocket-js'
import { shell } from 'electron'
import { formatDate } from '@/utils/timeFormat'

const FormData = require('form-data');
const econfig = new eConfig()
let Base64 = require("js-base64").Base64

export default {
  name: "BilibiliLive",
  data: () => ({
    coverList: [],
    picId: 0,
    picData: null,
    picUrl: "",
    picAvailable: false,

    categoryId: 2,
    concreteId: 107,

    //子分区
    concrete: [],
    //总数组
    categoryConcrete: [],
    getLiveStatusTimer: 0,

    //开播按钮等待
    isStarting: false,
    //关播按钮等待
    isClosing: false,
    livelink: "",
  }),
  beforeDestroy() {
    window.clearInterval(this.getLiveStatusTimer)
  },
  async created() {
    this.livelink = this.getLiveLink();

    this.$store.watch((state) => state.config.isLogin, async (newValue, oldValue) => {
      console.log('直播组件：登录变更：' + oldValue + ' -> ' + newValue)
      if (newValue) {
        await this.getLiveType()
      }
    }).bind(this)

    this.$store.watch((state) => state.liveInfo.isLive, async (newValue, oldValue) => {
      console.log('直播组件：直播状态变更：' + oldValue + ' -> ' + newValue)
      if (newValue) {
        if (this.$store.state.obsInfo.obsEnabled && this.$store.state.obsInfo.obsStartStreamingAfterStart) {
          setTimeout(() => {
            console.log("开始推流")
            this.startOBSWSStreaming()
          }, 8000)
        }
      } else {
        await this.getLiveType()
      }
    }).bind(this)


    if (this.$store.state.config.isLogin) {
      await this.getLiveType()
      await this.getLiveCovers()
    }

    this.getLiveStatusTimer = window.setInterval(this.getLiveStatus, 2 * 1000)
  },
  watch: {
    categoryId: {
      handler(val) {
        var result = this.categoryConcrete.find(
          (c) => Number(c.id) === val)
        if (result) {
          this.concrete = result.list
        } else {
          this.showSnackbar("你是怎么做到的？")
        }
      },
    },
    picId: {
      handler(val) {
        var result = this.coverList.find(
          (c) => Number(c.id) === val)
        console.log(result)
        if (result) {
          this.picUrl = result.url
          this.picData = result
          if (result.audit_status == 1) {
            this.picAvailable = true
          } else {
            this.picAvailable = false
            this.showSnackbar("暂不可用" + result.audit_reason)
          }
        } else {
          this.showSnackbar("你是怎么做到的？")
        }
      },
    },
  },
  filters: {
    formatDate(time) {
      let date = new Date(time)
      return formatDate(date, 'yyyy-MM-dd hh:mm')
    },
    getPhotoType(type) {
      switch (type) {
        case "Normal":
          return "图片"
        case "Gif":
          return "GIF"
      }
    }
  },
  beforeDestroy() {
    window.clearInterval(this.getLiveStatusTimer)
    window.clearInterval(this.getTranscodeInfoTimer)
  },
  methods: {
    getLiveLink() {
      return "https://live.bilibili.com/" + this.$store.state.roomInfo.roomId
    },
    async replaceCover() {
      if (this.picId != 0 && this.picUrl != "" && this.picData != null && this.picData.audit_status == 1) {
        var csrfToken = this.getCsrf()
        if (csrfToken != "") {
          var res = await this.$BilibiliCommon.postHTTPResult(
            "https://api.live.bilibili.com/room/v1/Cover/update",
            "https://link.bilibili.com",
            this.$store.state.BilibiliCommonCache.cookies,
            {
              room_id: this.$store.state.roomInfo.roomId,
              pic_id: this.picId,
              csrf_token: csrfToken,
              csrf: csrfToken,
            }
          )
          var resJson = JSON.parse(res.body)
          console.log(resJson)
          if (resJson.code == 0) {
            this.showSnackbar("选择封面成功")
          } else {
            this.showSnackbar("选择封面，请检查更新")
          }
        } else {
          this.showSnackbar("CSRF获取失败，请检查更新")
        }
      } else {
        this.showSnackbar("请选择封面")
      }
    },
    async setReplaceCover(cover, picId) {
      if (picId != 0) {
        var csrfToken = this.getCsrf()
        if (csrfToken != "") {

          const form = new FormData();
          var decodedFile = new Buffer(cover.split(',')[1], 'base64');
          form.append('bucket', 'live');
          form.append('dir', 'new_room_cover');
          form.append('file', decodedFile, { filename: 'blob' });

          var res = await this.$BilibiliCommon.postHTTPFormData(
            "https://api.bilibili.com/x/upload/web/image?csrf=" + csrfToken,
            "https://link.bilibili.com",
            this.$store.state.BilibiliCommonCache.cookies,
            form
          )
          var resJson = JSON.parse(res.body)
          console.log(resJson)
          if (resJson.code == 0) {
            var res = await this.$BilibiliCommon.postHTTPResult(
              "https://api.live.bilibili.com/room/v1/Cover/replace",
              "https://link.bilibili.com",
              this.$store.state.BilibiliCommonCache.cookies,
              {
                room_id: this.$store.state.roomInfo.roomId,
                url: resJson.data.location,
                pic_id: picId,
                type: "cover",
                csrf_token: csrfToken,
                csrf: csrfToken
              }
            )
            var resJson = JSON.parse(res.body)
            console.log(resJson)
            if (resJson.code == 0) {
              this.showSnackbar("修改封面成功")
            } else {
              this.showSnackbar(resJson.message)
            }
          } else {
            this.showSnackbar(resJson.message)
          }
        } else {
          this.showSnackbar("CSRF获取失败，请检查更新")
        }
      } else {
        this.showSnackbar("无ID")
      }
    },
    async getLiveCovers() {
      var res = await this.$BilibiliCommon.getHTTPResult(
        "https://api.live.bilibili.com/room/v1/Cover/get_list?room_id=" + this.$store.state.roomInfo.roomId + "&type=all_cover",
        "https://link.bilibili.com",
        this.$store.state.BilibiliCommonCache.cookies,
        {}
      )
      var resJson = JSON.parse(res.body)
      if (resJson.code == 0) {
        this.coverList = []
        resJson.data.forEach(element => {
          if (element.type == "cover") {
            this.coverList.push(element)
          }
        });
      }
    },
    async getLiveType() {
      var res = await this.$BilibiliCommon.getHTTPResult(
        "https://api.live.bilibili.com/room/v1/Area/getList?show_pinyin=1",
        "https://link.bilibili.com",
        this.$store.state.BilibiliCommonCache.cookies,
        {}
      )
      var resJson = JSON.parse(res.body)
      if (resJson.code == 0) {
        this.categoryConcrete = resJson.data
        this.categoryId = this.$store.state.liveInfo.liveCategoryId
        this.concreteId = this.$store.state.liveInfo.liveConcreteId
      }
    },
    async startLive() {
      if (!this.isStarting) {
        this.isStarting = true
        this.$store.state.liveInfo.liveCategoryId = this.categoryId
        this.$store.state.liveInfo.liveConcreteId = this.concreteId
        this.$BilibiliCommon.saveNewData(this)
        if (this.checkcategoryConcrete()) {
          await this.getLiveStreamKeyAndUrl()
        } else {
          this.showSnackbar("请设置分区")
        }
        this.isStarting = false
      } else {
        this.showSnackbar("正在尝试开播，请稍等。")
      }
    },
    async getLiveStreamKeyAndUrl() {
      var csrfToken = this.getCsrf()
      if (csrfToken != "") {
        var res = await this.$BilibiliCommon.postHTTPResult(
          "https://api.live.bilibili.com/room/v1/Room/startLive",
          "https://link.bilibili.com",
          this.$store.state.BilibiliCommonCache.cookies,
          {
            room_id: this.$store.state.roomInfo.roomId,
            platform: "pc",
            area_v2: this.$store.state.liveInfo.liveConcreteId,
            csrf_token: csrfToken,
            csrf: csrfToken,
          }
        )
        var resJson = JSON.parse(res.body)
        if (resJson.code == 0) {
          this.$store.state.liveInfo.liveStreamUrl = resJson.data.rtmp.addr
          this.$store.state.liveInfo.liveStreamKey = resJson.data.rtmp.code
          this.writeOBSWS()
          this.showSnackbar("开播成功")
        } else {
          this.showSnackbar("开播失败，请检查更新")
        }
      } else {
        this.showSnackbar("CSRF获取失败，请检查更新")
      }
    },
    getCsrf() {
      var csrfToken = ""
      this.$store.state.BilibiliCommonCache.cookies.forEach(element => {
        if (element.indexOf("bili_jct=") != -1) {
          csrfToken = this.getJct(element)
        }
      });
      console.log(csrfToken)
      return csrfToken
    },
    getJct(key) {
      return key.substring(key.indexOf("=") + 1, key.indexOf(";"))
    },
    checkcategoryConcrete() {
      var result = this.categoryConcrete.find(
        (c) => Number(c.id) === this.$store.state.liveInfo.liveCategoryId)
      if (!result) {
        return false
      }
      let concrete = result.list
      let result1 = concrete.find(
        (c) => String(c.id) === this.$store.state.liveInfo.liveConcreteId
      )
      if (!result1) {
        return false
      }
      return true
    },
    async stopLive() {
      var csrfToken = this.getCsrf()
      if (csrfToken != "") {
        var res = await this.$BilibiliCommon.postHTTPResult(
          "https://api.live.bilibili.com/room/v1/Room/stopLive",
          "https://link.bilibili.com",
          this.$store.state.BilibiliCommonCache.cookies,
          {
            room_id: this.$store.state.roomInfo.roomId,
            platform: "pc",
            csrf_token: csrfToken,
            csrf: csrfToken,
          }
        )
        var resJson = JSON.parse(res.body)
        if (resJson.code == 0) {
          if (this.$store.state.obsInfo.obsEnabled && this.$store.state.obsInfo.obsStopStreamingAfterClose) {
            this.stopOBSWSStreaming()
          }
        } else {
          this.showSnackbar("关播失败，请检查更新")
        }
      } else {
        this.showSnackbar("CSRF获取失败，请检查更新")
      }
    },
    delayStopPush() {
      this.showSnackbar("8秒后关播")
      setTimeout(() => {
        this.showSnackbar("关闭直播")
        console.log("关闭直播")
        this.stopLive()
      }, 8000)
    },
    async setTitle() {
      var csrfToken = this.getCsrf()
      if (csrfToken != "") {
        var res = await this.$BilibiliCommon.postHTTPResult(
          "https://api.live.bilibili.com/room/v1/Room/update",
          "https://link.bilibili.com",
          this.$store.state.BilibiliCommonCache.cookies,
          {
            room_id: this.$store.state.roomInfo.roomId,
            title: this.$store.state.liveInfo.liveTitle,
            csrf_token: csrfToken,
            csrf: csrfToken,
          }
        )
        var resJson = JSON.parse(res.body)
        console.log(resJson)
        if (resJson.code == 0) {
          this.showSnackbar("修改标题成功")
        } else {
          this.showSnackbar("修改标题失败，请检查更新")
        }
      } else {
        this.showSnackbar("CSRF获取失败，请检查更新")
      }
    },
    async getLiveStatus() {
      if (this.$store.state.config.isLogin) {
        var res = await this.$BilibiliCommon.getHTTPResult(
          "https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo?room_ids=" + this.$store.state.roomInfo.roomId + "&req_biz=link-center",
          "https://link.bilibili.com",
          this.$store.state.BilibiliCommonCache.cookies,
        )
        var resJson = JSON.parse(res.body)
        console.log(resJson)
        if (resJson.code == 0) {
          if (resJson.data.by_room_ids[this.$store.state.roomInfo.roomId].live_status == 1) {
            this.$store.state.liveInfo.isLive = true
          } else {
            this.$store.state.liveInfo.isLive = false
          }
        }
      }
    },
    GenGuid() {
      var e, t = 0, n = (new Date).getTime().toString(32);
      for (e = 0; e < 5; e++)
        n += Math.floor(65535 * Math.random()).toString(32);
      return "o_" + n + (t++).toString(32)
    },
    onCopy: function () {
      this.showSnackbar("复制成功")
    },
    //OBS处理以及图片处理
    testOBSWS() {
      if (this.$store.state.obsInfo.obsPort != 0 && this.$store.state.obsInfo.obsPort != undefined) {
        const obs = new OBSWebSocket()
        obs.connect({ address: 'localhost:' + this.$store.state.obsInfo.obsPort, password: this.$store.state.obsInfo.obsPass })
          .then(() => {
            obs.send('SetStreamSettings', {
              'type': "rtmp_custom",
              settings: {
                server: this.$store.state.liveInfo.liveStreamUrl,
                key: this.$store.state.liveInfo.liveStreamKey,
                use_auth: false,
              },
              save: true
            }).then(() => {
              this.$store.state.obsInfo.obsEnabled = true
              this.$BilibiliCommon.saveNewData(this)
              this.showSnackbar("链接成功，已经启动OBS控制")
            }).catch(err => {
              this.showSnackbar("写入OBS失败：" + err.error)
            }).bind(this)
            obs.disconnect()
          })
          .catch(err => {
            this.showSnackbar("连接OBS失败：" + err.error)
          })
      } else {
        this.showSnackbar("请好好填写OBS控制端口")
      }
    },
    writeOBSWS() {
      if (this.$store.state.obsInfo.obsEnabled) {
        const obs = new OBSWebSocket()
        obs.connect({ address: 'localhost:' + this.$store.state.obsInfo.obsPort, password: this.$store.state.obsInfo.obsPass })
          .then(() => {
            obs.send('SetStreamSettings', {
              'type': "rtmp_custom",
              settings: {
                server: this.$store.state.liveInfo.liveStreamUrl,
                key: this.$store.state.liveInfo.liveStreamKey,
                use_auth: false,
              },
              save: true
            }).then(() => {
              this.showSnackbar("写入OBS成功")
            }).catch(err => {
              this.showSnackbar("写入OBS失败：" + err.error)
            }).bind(this)
            obs.disconnect()
          })
          .catch(err => {
            this.showSnackbar("连接OBS失败：" + err.error)
          })
      }
    },
    startOBSWSStreaming() {
      if (this.$store.state.obsInfo.obsEnabled) {
        const obs = new OBSWebSocket()
        obs.connect({ address: 'localhost:' + this.$store.state.obsInfo.obsPort, password: this.$store.state.obsInfo.obsPass })
          .then(() => {
            obs.send('StartStreaming').then(() => {
              this.showSnackbar("开始推流成功")
            }).catch(err => {
              this.showSnackbar("开始推流失败：" + err.error)
            }).bind(this)
            obs.disconnect()
          })
          .catch(err => {
            this.showSnackbar("连接OBS失败：" + err.error)
          })
      }
    },
    stopOBSWSStreaming() {
      if (this.$store.state.obsInfo.obsEnabled) {
        const obs = new OBSWebSocket()
        obs.connect({ address: 'localhost:' + this.$store.state.obsInfo.obsPort, password: this.$store.state.obsInfo.obsPass })
          .then(() => {
            obs.send('StopStreaming').then(() => {
              this.showSnackbar("停止推流成功")
            }).catch(err => {
              this.showSnackbar("停止推流失败：" + err.error)
            }).bind(this)
            obs.disconnect()
          })
          .catch(err => {
            this.showSnackbar("连接OBS失败：" + err.error)
          })
      }
    },
    resetOBSWS() {
      this.$store.state.obsInfo.obsEnabled = false
      this.$BilibiliCommon.saveNewData(this)
      this.showSnackbar("关闭成功")
    },
    showSnackbar(content) {
      this.$store.state.snackbar.text = content
      this.$store.state.snackbar.show = true
    },
    downloadOBSWS() {
      shell.openExternal("https://b-helper.oss-cn-shanghai.aliyuncs.com/BLiveHelper/OBS/obs-websocket-4.8.0-Windows-Installer.exe")
    },
    saveToCache(type) {
      switch (type) {
        case "Normal":
          if (this.$store.state.liveCoverCache.liveCover != null && this.$store.state.liveCoverCache.liveCover != undefined) {
            this.$store.state.liveInfo.cacheCovers.push({
              type: "Normal",
              uniqueId: this.GenGuid(),
              timestamp: Date.now(),
              cover: this.$store.state.liveCoverCache.liveCover
            })
            this.$BilibiliCommon.saveNewData(this)
            this.showSnackbar("保存成功")
          } else {
            this.showSnackbar("请先设置图片")
          }
          break
      }
    },
    async useFromCache(uniqueId, picId) {
      for (let i = 0; i < this.$store.state.liveInfo.cacheCovers.length; i++) {
        const element = this.$store.state.liveInfo.cacheCovers[i];
        if (element.uniqueId == uniqueId) {
          switch (element.type) {
            case "Normal":
              await this.setReplaceCover(element.cover, picId)
              break
          }
        }
      }
      //this.showSnackbar("使用成功")
    },
    removeFromCache(uniqueId) {
      for (let i = 0; i < this.$store.state.liveInfo.cacheCovers.length; i++) {
        const element = this.$store.state.liveInfo.cacheCovers[i];
        if (element.uniqueId == uniqueId) {
          this.$store.state.liveInfo.cacheCovers.splice(i, 1)
        }
      }
      this.$BilibiliCommon.saveNewData(this)
      this.showSnackbar("删除成功")
    }
  },
};
</script>