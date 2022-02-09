import Vue from "vue";
import Antd from "ant-design-vue";
import App from "./App.vue";
import "./registerServiceWorker";
import "ant-design-vue/dist/antd.css";
import store from "./store";
import axios from "axios";
import VueAxios from "vue-axios";
import device from "vue-device-detector";
import JsonExcel from "vue-json-excel";

Vue.component("downloadExcel", JsonExcel);
Vue.config.productionTip = false;

Vue.use(VueAxios, axios);
Vue.use(Antd);
Vue.use(device);

new Vue({
  store,
  render: (h) => h(App),
}).$mount("#app");
