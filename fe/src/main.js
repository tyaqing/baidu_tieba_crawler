import Vue from 'vue'
import ElementUI from 'element-ui'
import VueSocketio from 'vue-socket.io';

import App from './App';
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'

import route from './router'
import "element-ui/lib/theme-default/index.css"
Vue.use(VueSocketio, 'http://127.0.0.1:8081/');
Vue.use(ElementUI);
Vue.use(VueRouter);
Vue.use(VueResource);


const router = new VueRouter(route);

new Vue({
    router,
    ...App
}).$mount('#app');
