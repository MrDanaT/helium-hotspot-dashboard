<template>
  <div id="app">
    <div id="banner">Helium Hotspot Dashboard</div>
    <a-row>
      <a-col
        ><a-card
          title="User input data"
          style="width: 100%; border-width: 1px; border-color: black"
        >
          <a-col>
            <a-row>
              <a-form-model-item label="Start date"
                ><a-date-picker
                  format="DD-MM-YYYY"
                  :disabledDate="disabledDate"
                  :defaultValue="startDate"
                  @change="datePicked"
                />
                <a-button @click="addAddress" type="primary"
                  >Load data</a-button
                ></a-form-model-item
              >
            </a-row>
            <br />
            <a-row>
              <a-input
                placeholder="Input HS address"
                v-model="inputHotspotAddress"
                :style="{ width: textBoxWidth + '%' }"
              />
              <a-button
                @click="addAddress"
                :style="{ width: (100 - textBoxWidth) / 2 + '%' }"
                type="primary"
                >Add HS</a-button
              >
              <a-button
                @click="removeAddress(inputHotspotAddress)"
                :style="{ width: (100 - textBoxWidth) / 2 + '%' }"
                type="danger"
                >Remove HS</a-button
              ></a-row
            >
            <br />
            <a-row>
              <a-input
                placeholder="Input owner address"
                v-model="inputOwnerAddress"
                :style="{ width: textBoxWidth + '%' }"
              />
              <a-button
                @click="addOwnersHotspots"
                :style="{ width: 100 - textBoxWidth + '%' }"
                type="primary"
                >Add all HS</a-button
              ></a-row
            >
          </a-col>
        </a-card>
      </a-col>
      <a-col>
        <a-card title="Statistics">
          <a-card-grid type="inner">
            Total hotspots: {{ hotspotDict.length }}
          </a-card-grid>
          <a-card-grid type="inner">
            Last Days Total:
            {{ totalPreviousDay.toFixed(5) }} HNT
          </a-card-grid>
          <a-card-grid type="inner">
            Total online:
            {{ hotspotDict.filter((hs) => hs.status === "online").length }}
          </a-card-grid>
        </a-card>
        <br />
        <a-table
          :columns="columns"
          :data-source="mappedHotspots"
          :pagination="true"
          bordered
        >
          <span slot="name" slot-scope="name">
            <a
              v-bind:href="
                'https://explorer.helium.com/hotspots/' + findAddress(name)
              "
              >{{ normalise(name) }}</a
            >
          </span>
          <span slot="status" slot-scope="status">
            <a-tag :color="status === 'online' ? 'green' : 'volcano'">
              {{ status }}
            </a-tag>
          </span>
          <span slot="options" slot-scope="skip, hs">
            <a-button
              type="danger"
              @click="removeAddress(hs.address)"
            ></a-button>
          </span>
        </a-table>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import moment from "moment";
import Vue from "vue";

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    scopedSlots: {
      customRender: "name",
    },
    ellipsis: true,
  },
  {
    title: "Reward Scale",
    dataIndex: "reward_scale",
    ellipsis: true,
  },
  {
    title: "Status",
    dataIndex: "status",
    scopedSlots: {
      customRender: "status",
    },
    ellipsis: true,
  },
  {
    title: "Sync Percentage (%)",
    dataIndex: "syncPercentage",
    ellipsis: true,
  },
  {
    title: "Last Day Earned (HNT)",
    dataIndex: "lastDayEarned",
    ellipsis: true,
  },
  {
    title: "Options",
    dataIndex: "options",
    ellipsis: true,
    scopedSlots: {
      customRender: "options",
    },
  },
];

export default {
  name: "App",
  components: {},
  data() {
    return {
      hotspotDict: [],
      hotspotAPIUrl: "https://api.helium.io/v1/hotspots",
      startDate: moment(this.currDay).days(-3),
      inputHotspotAddress: "",
      inputOwnerAddress: "",
      textBoxWidth: 80,
      columns,
    };
  },
  computed: {
    mappedHotspots() {
      return this.hotspotDict;
    },
    totalPreviousDay() {
      return this.hotspotDict
        .map((hs) => hs.lastDayEarned)
        .reduce(
          (previousValue, currentValue) => previousValue + currentValue,
          0
        );
    },
    currDay() {
      return new Date(new Date().toISOString());
    },
  },
  methods: {
    findIndexOf(nameOrAddress) {
      const idx = this.hotspotDict.findIndex(
        (hs) => hs.name === nameOrAddress || hs.address === nameOrAddress
      );

      return idx;
    },
    normalise(name) {
      return name
        .split("-")
        .join(" ")
        .replace(/(^\w{1})|(\s{1}\w{1})/g, (match) => match.toUpperCase());
    },
    hotspotAlreadyAdded(nameOrAddress) {
      let idx = this.findIndexOf(nameOrAddress);

      return idx > -1;
    },
    getHotspot(nameOrAddress) {
      const idx = this.findIndexOf(nameOrAddress);

      return idx > -1 ? this.hotspotDict[idx] : false;
    },
    addAddress() {
      if (this.hotspotAlreadyAdded(this.inputHotspotAddress)) {
        this.openNotification(
          "Cannot add hotspot",
          "Hotspot is already in the list.",
          "error"
        );
      } else {
        this.processHotspot(this.inputHotspotAddress)
          .then(() => {
            this.inputHotspotAddress = "";
            this.openNotification(
              "Succesful",
              "Hotspot has been added.",
              "success"
            );
          })
          .catch(() => {
            this.openNotification(
              "Cannot add hotspot",
              "Address is wrong.",
              "error"
            );
          });
      }
    },
    findAddress(name) {
      const idx = this.findIndexOf(name);

      return idx > -1 ? this.hotspotDict[idx].address : "#";
    },
    datePicked(time, timeString) {
      console.log(time, timeString);
    },
    disabledDate(current) {
      return current > moment();
    },
    convertAPIHotspotToMyHotspot(data, owner) {
      return {
        key: data.address,
        status: data.status.online,
        height: data.status.height || 0,
        reward_scale: data?.reward_scale?.toFixed(2) || 0,
        name: data.name,
        syncPercentage: ((data?.status?.height / data.block) * 100).toFixed(2),
        address: data.address,
        lastDayEarned: this.getLastDayEarned(data.address),
        owner: owner,
      };
    },
    getLastDayEarned(address) {
      this.getYesterdaysReward(address).then(({ data }) => {
        this.hotspotDict[this.findIndexOf(address)].lastDayEarned = data.total;
      });
    },
    async processHotspot(hotspotAddress) {
      await Vue.axios
        .get(`${this.hotspotAPIUrl}/${hotspotAddress}`)
        .then(({ data }) => {
          data = data.data;
          this.hotspotDict.push(this.convertAPIHotspotToMyHotspot(data, null));
        });
    },
    openNotification(message, description, type) {
      this.$notification[type]({
        message,
        description,
      });
    },
    async getOwnersHotspots() {
      let results = [];
      await Vue.axios
        .get(
          `https://api.helium.io/v1/accounts/${this.inputOwnerAddress}/hotspots`
        )
        .then(({ data }) => {
          results = data.data.map((hs) =>
            this.convertAPIHotspotToMyHotspot(hs, this.inputOwnerAddress)
          );
        })
        .catch(() => {
          this.openNotification(
            "Cannot add hotspot",
            "Address is wrong.",
            "error"
          );
        });

      return results;
    },
    addOwnersHotspots() {
      let isAdded = 0;
      let isIgnored = 0;
      this.getOwnersHotspots()
        .then((arr) => {
          arr.forEach((hs) => {
            console.log(hs);
            if (this.findIndexOf(hs.address) == -1) {
              this.hotspotDict.push(hs);
              this.inputOwnerAddress = "";
              isAdded++;
            } else {
              isIgnored++;
            }
          });
        })
        .then(() => {
          if (isAdded > 0) {
            this.openNotification(
              "Succesful",
              `${isAdded} hotspot(s) have been added.`,
              "success"
            );
          }
          if (isIgnored > 0) {
            this.openNotification(
              "Cannot add hotspot(s)",
              `${isIgnored} hotspot(s) are already in the list.`,
              "warning"
            );
          }
        });
    },
    getStartOfGivenDay(date) {
      var res = new Date(date.getTime());
      res.setUTCHours(0, 0, 0, 0);
      return res;
    },
    getEndOfGivenDay(date) {
      var res = new Date(date.getTime());
      res.setUTCHours(23, 59, 59, 999);
      return res;
    },
    async getYesterdaysReward(address) {
      const now = this.currDay;
      var yesterday = new Date(now.getTime());
      yesterday.setDate(now.getDate() - 1);
      return await this.getReward(
        address,
        this.getStartOfGivenDay(yesterday),
        this.getEndOfGivenDay(yesterday)
      );
    },
    async getTodaysReward(address) {
      const startDay = this.getStartOfGivenDay(new Date());
      const endDay = this.getEndOfGivenDay(startDay);
      let result = await this.getReward(address, startDay, endDay);
      return result;
    },
    async getReward(address, startDay, endDay) {
      let result = await this.rewardCall(address, startDay, endDay);
      return result;
    },
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
    removeAddress(address) {
      const idx = this.findIndexOf(address);
      if (idx === -1) {
        this.openNotification(
          "Cannot remove hotspot",
          "Hotspot is not in the list.",
          "error"
        );
      } else {
        this.hotspotDict.splice(idx, 1);
        this.inputHotspotAddress = "";
        this.openNotification(
          "Succesful",
          "Hotspot has been removed.",
          "success"
        );
      }
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#banner {
  height: 3rem;
  background: black;
  color: white;
  text-align: center;
  vertical-align: middle;
  margin: auto;
  padding: 10px;
}
</style>
