<template>
  <div id="app">
    <HotspotTable :startDateMining="startDateMining" :hotspotAddresses="hotspotAddresses" />
    <HotspotDaily :startDateMining="startDateMining" :hotspotAddresses="hotspotAddresses" />
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
    };
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
