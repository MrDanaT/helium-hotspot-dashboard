<template>
  <div class="hello">
    <a-table
      :columns="columns"
      :data-source="hotspots"
      :loading="loading"
      :pagination="false"
      :row-key="(hs) => hs.hotspotInfo.address"
      bordered
    >
      <template slot="title">
        <a-button @click="refreshTable">Hotspot overview</a-button>
      </template>
      <span slot="name" slot-scope="name">
        <a
          v-bind:href="
            'https://explorer.helium.com/hotspots/' + findAddress(name)
          "
          >{{ name }}</a
        >
      </span>
      <span slot="status" slot-scope="status">
        <a-tag :color="status === 'online' ? 'green' : 'volcano'">
          {{ status }}
        </a-tag>
      </span>
      <template slot="footer"> © Dana Inc. </template>
    </a-table>
  </div>
</template>

<script>
import Vue from "vue";

const columns = [
  {
    title: "Name",
    dataIndex: "hotspotInfo.name",
    scopedSlots: {
      customRender: "name",
    },
    ellipsis: true,
  },
  {
    title: "Reward Scale",
    dataIndex: "hotspotInfo.reward_scale",
  },
  {
    title: "Status",
    dataIndex: "hotspotInfo.status",
    scopedSlots: {
      customRender: "status",
    },
  },
  {
    title: "Height",
    dataIndex: "hotspotInfo.height",
  },
  {
    title: "Sync Percentage (%)",
    dataIndex: "hotspotInfo.synced_percentage",
  },
  {
    title: "Last Day Earned (HNT)",
    dataIndex: "rewardInfo.last_day_earned",
    ellipsis: true,
  },
  {
    title: "Today's Rewards (HNT)",
    dataIndex: "rewardInfo.today_earned",
    ellipsis: true,
  },
  {
    title: "Total Rewards (HNT)",
    dataIndex: "rewardInfo.total_earned",
    ellipsis: true,
  },
];
export default {
  name: "HotspotTable",
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
      columns,
      loading: false,
      hotspots: [],
      hotspotAPIUrl: "https://api.helium.io/v1/hotspots",
    };
  },
  created() {
    this.loadMissingTable();
  },
  methods: {
    async rewardCall(address, startDay, endDay) {
      try {
        let res = await Vue.axios({
          url: `${
            this.hotspotAPIUrl
          }/${address}/rewards/sum?min_time=${startDay.toISOString()}&max_time=${endDay.toISOString()}`,
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
    getEndOfGivenDay(date) {
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59
      );
    },
    getStartOfGivenDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    },
    async getTodaysReward(address) {
      const startDay = this.getStartOfGivenDay(new Date());
      const endDay = this.getEndOfGivenDay(startDay);
      let result = await this.getReward(address, startDay, endDay);
      return result;
    },
    async getYesterdaysReward(address) {
      const now = new Date();
      const startDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
      );
      const endDay = new Date(
        startDay.getFullYear(),
        startDay.getMonth(),
        startDay.getDate(),
        23,
        59,
        59
      );

      return await this.getReward(address, startDay, endDay);
    },
    async getTotalReward(address) {
      const endDay = new Date();
      return await this.getReward(address, this.startDateMining, endDay);
    },
    findAddress(name) {
      const found = this.hotspots.find((hs) => {
        return hs.hotspotInfo.name === name;
      });

      return found ? found.hotspotInfo.address : "";
    },
    loadMissingTable() {
      const missing = this.getMissingHotspots();
      console.log(missing);
      this.loadTable(missing);
    },
    refreshTable() {
      this.hotspots = [];
      this.loadTable(this.hotspotAddresses);
    },
    loadTable(hotspots) {
      this.loading = true;
      hotspots.forEach((hotspotAddress) => {
        Vue.axios
          .get(`${this.hotspotAPIUrl}/${hotspotAddress}`)
          .then(({ data }) => {
            data = data.data;
            this.hotspots.push({
              hotspotInfo: {
                address: hotspotAddress,
                name: data.name,
                reward_scale: data?.reward_scale?.toFixed(3) || 0,
                status: data.status.online,
                height: data.status.height || 0,
                synced_percentage: (
                  (data?.status?.height / data.block) *
                  100
                ).toFixed(3),
              },
              rewardInfo: {
                last_day_earned: 0,
                today_earned: 0,
                total_earned: 0,
              },
            });
            return data.name;
          })
          .then((name) => {
            this.getYesterdaysReward(hotspotAddress).then((data) => {
              data = data.data;
              const found = this.hotspots.find((hs) => {
                return hs.hotspotInfo.name === name;
              });

              if (found) {
                found.rewardInfo.last_day_earned = data.total;
              }
            });
            this.getTodaysReward(hotspotAddress).then((data) => {
              data = data.data;
              const found = this.hotspots.find((hs) => {
                return hs.hotspotInfo.name === name;
              });

              if (found) {
                found.rewardInfo.today_earned = data.total;
              }
            });
            this.getTotalReward(hotspotAddress).then((data) => {
              data = data.data;
              const found = this.hotspots.find((hs) => {
                return hs.hotspotInfo.name === name;
              });

              if (found) {
                found.rewardInfo.total_earned = data.total;
              }
            });
          })
          .then(() => {
            this.hotspots = this.hotspots.sort((a, b) => {
              let nameA = a.hotspotInfo.name;
              return nameA.localeCompare(b.hotspotInfo.name, "en");
            });
            this.loading = false;
            this.$emit(
              "emitHotspots",
              this.hotspots.map((x) => x.hotspotInfo.name)
            );
          });
      });
    },
    getMissingHotspots() {
      const intersection = this.hotspotAddresses.filter((o1) =>
        this.hotspots.some((o2) => o1 === o2.hotspotInfo.address)
      );
      const diff = this.hotspotAddresses.filter(
        (x) => !intersection.includes(x)
      );

      return diff;
    },
    removeDeletedHotspots() {
      const missing = this.getMissingHotspots();
      this.hotspots = this.hotspots.filter((x) =>
        missing.includes(x.hotspotInfo.address)
      );
    },
  },
  watch: {
    hotspotAddresses: function () {
      console.log("called!");
      this.removeDeletedHotspots();
      this.loadMissingTable();
    },
  },
};
</script>
