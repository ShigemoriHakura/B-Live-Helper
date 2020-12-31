<template>
  <div class="home">
    <BilibiliPanel />
  </div>
</template>

<script>
// @ is an alias to /src
import BilibiliPanel from '@/components/BilibiliPanel.vue'

export default {
  name: 'Home',
  components: {
    BilibiliPanel
  }
}
</script>
