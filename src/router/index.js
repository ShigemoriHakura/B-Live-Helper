import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/live',
    name: 'Live',
    component: () => import('../views/Live.vue'),
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('../views/Account.vue'),
  },
  {
    path: '/mate',
    name: 'Mate',
    component: () => import('../views/Mate.vue'),
  },
  {
    path: '/log',
    name: 'Log',
    component: () => import('../views/Log.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue'),
  }
]

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})

export default router
