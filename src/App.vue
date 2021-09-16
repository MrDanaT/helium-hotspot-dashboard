<template>
  <div id="app">
    {{ hotspotNames }}
    <a-row type="flex">
      <a-col :span="4">
        <a-card>
          <a-date-picker />
        </a-card>
      </a-col>
      <a-col :span="20"
        ><div style="margin-bottom: 1em">
          <input
            placeholder="Enter hotspot address"
            type="text"
            v-model="text"
          />
          <button @click="addToHotspots">ADD</button>
          <button @click="removeFromHotspots">REMOVE</button>
        </div>
        <HotspotTable
          style="margin-bottom: 1em"
          :startDateMining="startDateMining"
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

export default {
  name: "App",
  components: {
    HotspotTable,
    HotspotDaily,
  },
  data() {
    return {
      hotspotAddresses: [],
      startDateMining: new Date(2021, 7, 13),
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
      console.log(idx);
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
