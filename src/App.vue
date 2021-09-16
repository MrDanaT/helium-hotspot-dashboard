<template>
  <div id="app">
    <a-row type="flex" justify="space-around">
      <a-col :span="4">
        <a-card style="background-color: #AAAAAA" title="User Input">
          <a-card title="Start Date" type="inner">
            <a-date-picker v-model="startDateMining" />
          </a-card>
          <a-card title="Add/Remove hotspots" type="inner"
            ><input
              placeholder="Enter hotspot address"
              type="text"
              v-model="text"
              style="margin-right: 0.8em"
            />
            <a-button type="primary" @click="addToHotspots" shape="round"
              >ADD</a-button
            >
            <a-button
              :disabled="hotspotAddresses.length === 0"
              shape="round"
              type="danger"
              @click="removeFromHotspots"
              >REMOVE</a-button
            ></a-card
          >
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

export default {
  name: "App",
  components: {
    HotspotTable,
    HotspotDaily,
  },
  data() {
    return {
      hotspotAddresses: [
      ],
      startDateMining: moment(new Date(2021, 7, 13)),
      text: "",
      hotspotNames: [],
    };
  },
  methods: {
    addToHotspots() {
      this.hotspotAddresses.push(this.text);
      this.text = "";
    },
    removeFromHotspots() {
      const idx = this.hotspotNames.findIndex((hs) => hs === this.text);
      if (idx < 0) return;

      this.hotspotAddresses.splice(idx, 1);
      this.text = "";
    },
    processHotspots(names) {
      this.hotspotNames = names;
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
