// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'


import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';

// cesium 配置
import widgets from "../node_modules/cesium/Source/Widgets/widgets.css"
import index from "./assets/index.scss"
Vue.prototype.widgets = widgets

Vue.config.productionTip = false
Vue.use(Element)
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
