<template>
  <div id="app">
    <a-row type="flex" justify="space-around">
      <a-col :span="4">
        <a-card style="background-color: #cccccc" title="User Input">
          <a-card title="Start Date" type="inner">
            <a-date-picker v-model="startDateMining" />
          </a-card>
          <a-card title="Add/Remove hotspots" type="inner"
            ><input
              placeholder="Enter hotspot address"
              type="inputHotspotAddress"
              v-model="inputHotspotAddress"
              style="margin-right: 0.8em"
            />
            <a-button type="primary" @click="addAddressToHotspots" shape="round"
              >ADD</a-button
            >
            <a-button
              :disabled="hotspotAddresses.length === 0"
              shape="round"
              type="danger"
              @click="removeFromHotspots"
              >REMOVE</a-button
            ></a-card
          ><a-card title="Add hotspots w. owner address" type="inner"
            ><input
              placeholder="Enter your wallet address"
              type="inputHotspotAddress"
              v-model="inputOwnerAddress"
              style="margin-right: 0.8em"
            />
            <a-button type="primary" @click="addOwnersHotspots" shape="round"
              >ADD</a-button
            >
            <a-button
              :disabled="hotspotAddresses.length === 0"
              shape="round"
              type="danger"
              @click="removeOwnersHotspots"
              >REMOVE</a-button
            >
          </a-card>
        </a-card>
      </a-col>
      <a-col :span="18"
        ><div style="margin-bottom: 1em"></div>
        <HotspotTable
          style="margin-bottom: 1em"
          :startDateMining="new Date(startDateMining)"
          :hotspotAddresses="hotspotAddresses"
          @emitHotspots="processHotspots" />
        <a-collapse>
          <a-collapse-panel key="2">
            <HotspotDaily
              :startDateMining="startDateMining"
              :hotspotAddresses="hotspotAddresses"
          /></a-collapse-panel> </a-collapse
      ></a-col>
    </a-row>
  </div>
</template>

<script>
import HotspotTable from "./components/HotspotTable.vue";
import HotspotDaily from "./components/HotspotDaily.vue";
import moment from "moment";
import Vue from "vue";

export default {
  name: "App",
  components: {
    HotspotTable,
    HotspotDaily,
  },
  data() {
    return {
      hotspotAddresses: [""],
      startDateMining: moment(new Date(2021, 7, 13)),
      inputHotspotAddress: "",
      inputOwnerAddress: "",
      hotspotNames: [],
    };
  },
  created() {
    this.addOwnersHotspots();
    this.addAddressToHotspots();
  },
  methods: {
    addAddressToHotspots() {
      if (this.hotspotAddresses.includes(this.inputHotspotAddress)) return;
      this.hotspotAddresses.push(this.inputHotspotAddress);
      this.inputHotspotAddress = "";
    },
    removeFromHotspots() {
      let idx = this.hotspotNames.findIndex(
        (hs) => hs === this.inputHotspotAddress
      );
      if (idx < 0)
        idx = this.hotspotAddresses.findIndex(
          (hs) => hs === this.inputHotspotAddress
        );

      if (idx < 0) return;

      this.hotspotAddresses.splice(idx, 1);
      this.inputHotspotAddress = "";
    },
    processHotspots(names) {
      this.hotspotNames = names;
    },
    async getOwnersHotspots() {
      try {
        let res = await Vue.axios({
          url: `https://api.helium.io/v1/accounts/${this.inputOwnerAddress}/hotspots`,
          method: "get",
          timeout: 8000,
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.status == 200) {
          return res.data.data.map((hs) => hs.address);
        }
      } catch (err) {
        console.error(err);
      }
    },
    addOwnersHotspots() {
      this.getOwnersHotspots().then((arr) => {
        arr.forEach((element) => {
          if (this.hotspotAddresses.includes(element)) return;
          this.hotspotAddresses.push(element);
          this.inputOwnerAddress = "";
        });
      });
    },
    removeOwnersHotspots() {
      this.getOwnersHotspots().then((arr) => {
        arr.forEach((element) => {
          const idx = this.hotspotAddresses.findIndex((x) => x === element);
          if (idx < 0) return;
          this.hotspotAddresses.splice(idx, 1);
          this.inputOwnerAddress = "";
        });
      });
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
