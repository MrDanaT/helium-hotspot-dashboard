<template>
  <div class="hello">
    <a-table
      :columns="hotspots"
      :data-source="data"
      :loading="loading"
      :pagination="false"
      :row-key="(hs) => hs.hotspotInfo.address"
      bordered
    >
      <template slot="title"> Daily overview </template>
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
  },
  data() {
    return {
      hotspots: [{
          title: 'Date',
          dataIndex: 'date'
      }],
      loading: false,
      hotspotAPIUrl: "https://api.helium.io/v1/hotspots",
      data: [],
    };
  },
  created() {
    this.getHotspotInfoFromApi();
  },
  methods: {
    async getHotspotInfoFromApi() {
      this.loading = true;
      this.hotspotAddresses.forEach((hotspotAddress) => {
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
          })
          .then(() => {
            this.hotspots = this.hotspots.sort((a, b) => {
              let nameA = a.hotspotInfo.name;
              return nameA.localeCompare(b.hotspotInfo.name, "en");
            });
          });
      });

      this.loading = false;
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
    async getReward(address, startDay, endDay) {
      let result = await this.rewardCall(address, startDay, endDay);
      return result;
    },
    findAddress(name) {
      const found = this.hotspots.find((hs) => {
        return hs.hotspotInfo.name === name;
      });

      return found ? found.hotspotInfo.address : "";
    },
  },
};
</script>
