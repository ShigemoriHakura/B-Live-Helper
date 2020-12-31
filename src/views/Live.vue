<template>
  <div class="live">
    <BilibiliLive />
  </div>
</template>

<script>
// @ is an alias to /src
import BilibiliLive from '@/components/BilibiliLive.vue'

export default {
  name: 'Live',
  components: {
    BilibiliLive
  }
}
</script>
