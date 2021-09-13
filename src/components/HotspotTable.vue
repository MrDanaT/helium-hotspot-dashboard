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
      <template slot="title"> Hotspot overview </template>
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
    reward_scale: "uit_scoped",
    scopedSlots: {
      customRender: "name",
      reward_scale: "scoped",
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
  data() {
    return {
      startDateMining: new Date(2021, 7, 13),
      hotspotAddresses: [
        "112BVPYjzt5AKpXifygAyj4Mj8i7e77V1itgVFeZQFddkniJ2Hh1",
        "11o2tzY31XD6B2uBn6bjB75vJWtkNcsvqURF6B3DiQpyuWFhhu9",
        "1128yuXLjSzA8bu41xADmTKLE74415aw1zQVkCyL89dkgQvH4mC9",
        "11pCH9wvpcJARCh1UnZUWq6goXQVZjm3uAfd39CKSrCNt8Z1F9Y",
      ],
      columns,
      loading: false,
      hotspots: [],
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
          .get(`https://api.helium.io/v1/hotspots/${hotspotAddress}`)
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
    async getTodaysReward(address) {
      const now = new Date();
      const startDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const endDay = new Date(
        startDay.getFullYear(),
        startDay.getMonth(),
        startDay.getDate(),
        23,
        59,
        59
      );
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
  },
};
</script>

<style>
th.column-money,
td.column-money {
  text-align: right !important;
}
</style>
