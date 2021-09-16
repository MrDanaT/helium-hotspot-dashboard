<template>
  <div class="hello">
    <a-card style="background-color: #cccccc" title="Statistics">
      <a-row type="flex" justify="space-around">
        <a-col>
          <a-card type="inner" title="Grand total:">
            {{ grandTotal }}
          </a-card></a-col
        >
        <a-col>
          <a-card type="inner" title="Grand average/hotspot:">
            {{ grandAverageHotspot }}/hotspot
          </a-card></a-col
        >
        <a-col>
          <a-card type="inner" title="Grand average/day:">
            {{ grandAveragePerDay }}/day
          </a-card></a-col
        ><a-col>
          <a-card type="inner" title="Grand total yesterday:">
            {{ grandTotalLastDay }}/day
          </a-card></a-col
        ><a-col>
          <a-card type="inner" title="Grand total today:">
            {{ grandTotalToday }}/day
          </a-card></a-col
        >
      </a-row>
    </a-card>
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
    dataIndex: "rewardInfo.lastDayEarned",
    ellipsis: true,
  },
  {
    title: "Today's Rewards (HNT)",
    dataIndex: "rewardInfo.todayEarned",
    ellipsis: true,
  },
  {
    title: "Total Rewards (HNT) *since input date",
    dataIndex: "rewardInfo.totalEarned",
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
  computed: {
    grandTotal() {
      let result = 0.0;
      this.hotspots.forEach((a) => {
        result += a.rewardInfo.totalEarned;
      });
      return result.toFixed(3);
    },
    grandAverageHotspot() {
      return (this.grandTotal / this.hotspots.length).toFixed(3);
    },
    grandAveragePerDay() {
      const diffInTime = new Date() - this.startDateMining;
      const diffInDays = diffInTime / (1000 * 3600 * 24);
      return (this.grandTotal / diffInDays).toFixed(3);
    },
    grandTotalLastDay() {
      let result = 0.0;
      this.hotspots.forEach((a) => {
        result += a.rewardInfo.lastDayEarned;
      });
      return result.toFixed(3);
    },
    grandTotalToday() {
      let result = 0.0;
      this.hotspots.forEach((a) => {
        result += a.rewardInfo.todayEarned;
      });
      return result.toFixed(3);
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
                lastDayEarned: 0,
                todayEarned: 0,
                totalEarned: 0,
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
                found.rewardInfo.lastDayEarned = data.total;
              }
            });
            this.getTodaysReward(hotspotAddress).then((data) => {
              data = data.data;
              const found = this.hotspots.find((hs) => {
                return hs.hotspotInfo.name === name;
              });

              if (found) {
                found.rewardInfo.todayEarned = data.total;
              }
            });
            this.getTotalReward(hotspotAddress).then((data) => {
              data = data.data;
              const found = this.hotspots.find((hs) => {
                return hs.hotspotInfo.name === name;
              });

              if (found) {
                found.rewardInfo.totalEarned = data.total;
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
      this.removeDeletedHotspots();
      this.loadMissingTable();
    },
  },
};
</script>
