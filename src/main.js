import Vue from "vue";
import Antd from "ant-design-vue";
import App from "./App.vue";
import "./registerServiceWorker";
import "ant-design-vue/dist/antd.css";
import store from "./store";
import axios from "axios";
import VueAxios from "vue-axios";

Vue.config.productionTip = false;

Vue.use(VueAxios, axios);
Vue.use(Antd);

new Vue({
  store,
  render: (h) => h(App),
}).$mount("#app");
