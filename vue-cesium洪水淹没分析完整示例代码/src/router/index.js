import Vue from 'vue'
import Router from 'vue-router'
import map3DView from '@/components/map3DView'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'map3DView',
      component: map3DView 
    }
  ]
})
