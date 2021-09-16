<template>
  <div id="app">
    <div>
      <input placeholder="Enter hotspot address" type="text" v-model="text" />
      <button @click="addToHotspots">ADD</button>
    </div>
    <HotspotTable
      style="margin-bottom: 1em"
      :startDateMining="startDateMining"
      :hotspotAddresses="hotspotAddresses"
    />
    <a-collapse>
      <a-collapse-panel key="2">
        <HotspotDaily
          :startDateMining="startDateMining"
          :hotspotAddresses="hotspotAddresses"
      /></a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script>
import HotspotTable from "./components/HotspotTable.vue";
import HotspotDaily from "./components/HotspotDaily.vue";

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
      startDateMining: new Date(2021, 7, 13),
      text: "",
    };
  },
  methods: {
    addToHotspots() {
      this.hotspotAddresses.push(this.text);
      this.text = "";
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
