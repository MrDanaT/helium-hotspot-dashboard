<template>
  <div class="hello">
    <a-table
      :columns="hotspots"
      :data-source="data"
      :loading="loading"
      :row-key="(hs) => hs.date.toString()"
      bordered
    >
      <template slot="title">
        <a-button @click="refreshTable">Daily overview</a-button>
      </template>
      <template slot="footer"> © Dana Inc. </template>
    </a-table>
  </div>
</template>

<script>
import Vue from "vue";

export default {
  name: "HotspotDaily",
  props: {
    hotspotAddresses: {
      type: Array,
      required: true,
    },
    startDateMining: {
      type: Date,
      required: true,
    },
  },
  data() {
    return {
      hotspots: [
        {
          title: "Date",
          dataIndex: "date",
        },
      ],
      loading: false,
      hotspotAPIUrl: "https://api.helium.io/v1/hotspots",
      data: [],
    };
  },
  methods: {
    async getHotspotInfoFromApi(hotspots) {
      this.loading = true;
      hotspots.forEach((hotspotAddress) => {
        Vue.axios
          .get(`${this.hotspotAPIUrl}/${hotspotAddress}`)
          .then(({ data }) => {
            data = data.data;
            this.hotspots.push({
              title: data.name,
              dataIndex: data.name,
              address: hotspotAddress,
            });
            return data.name;
          });
      });
      this.loading = false;
    },
    async loadMissingHotspots() {
      let missing = this.getMissingHotspots();
      this.getHotspotInfoFromApi(missing);
    },
    async rewardCall(address, startDay, endDay) {
      try {
        let res = await Vue.axios({
          url: `https://api.helium.io/v1/hotspots/${address}/rewards/sum?min_time=${startDay.toISOString()}&max_time=${endDay.toISOString()}`,
          method: "get",
          timeout: 8000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.status == 200) {
          return res.data;
        }
      } catch (err) {
        console.error(err);
      }
    },
    refreshTable() {
      this.loadTable(this.hotspotAddresses);
    },
    async loadTable() {
      this.data = [];
      let startDay = new Date(this.startDateMining);
      let endDay = new Date();
      while (startDay <= endDay) {
        const startDayEndOfDay = new Date(
          startDay.getFullYear(),
          startDay.getMonth(),
          startDay.getDate(),
          23,
          59,
          59
        );
        let result = {};
        result.date = new Date(startDay).toDateString();

        this.hotspots.forEach((hs) => {
          if (!hs.address) return;
          result[hs.dataIndex] = 0;
        });

        this.hotspots.forEach((hs) => {
          if (!hs.address) return;
          this.rewardCall(hs.address, startDay, startDayEndOfDay).then(
            (val) => {
              result[hs.dataIndex] = (val.data.total + "").replace(".", ",");
            }
          );
        });

        startDay.setDate(startDay.getDate() + 1);
        this.data.push(result);
      }
    },
    getMissingHotspots() {
      const intersection = this.hotspotAddresses.filter((o1) =>
        this.hotspots.some((o2) => o1 === o2.address)
      );
      const diff = this.hotspotAddresses.filter(
        (x) => !intersection.includes(x)
      );

      return diff;
    },
    removeDeletedHotspots() {
      const missing = this.getMissingHotspots().filter((x) => x !== "");
      this.hotspots = this.hotspots.filter((x) => missing.includes(x.address));
    },
  },
  watch: {
    hotspotAddresses: function () {
      this.removeDeletedHotspots();
      this.loadMissingHotspots();
    },
  },
};
</script>
