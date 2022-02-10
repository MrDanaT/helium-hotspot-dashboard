<template>
  <div id="app">
    <div id="banner" style="font-weight: bold">Helium Hotspot Dashboard</div>
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
                  v-model="datePicked"
              /></a-form-model-item>
            </a-row>
            <br />
            <a-row>
              <a-auto-complete
                placeholder="Input HS address"
                v-model="inputHotspotAddress"
                :data-source="addressAutocomplete"
                :style="{ width: textBoxWidth + '%' }"
              />
              <a-button
                @click="addAddress"
                :style="{ width: (100 - textBoxWidth) / 2.0 + '%' }"
                type="primary"
                >{{ $device.mobile ? "+" : "Add" }} HS</a-button
              >
              <a-button
                @click="removeAddress(inputHotspotAddress)"
                :style="{ width: (100 - textBoxWidth) / 2.0 + '%' }"
                type="danger"
                >{{ $device.mobile ? "-" : "Remove" }} HS</a-button
              ></a-row
            >
            <br />
            <a-row>
              <a-auto-complete
                placeholder="Input owner address"
                v-model="inputOwnerAddress"
                :data-source="ownerAutocomplete"
                :style="{ width: textBoxWidth + '%' }"
              />
              <a-button
                @click="addOwnersHotspots"
                :style="{ width: (100 - textBoxWidth) / 2 + '%' }"
                type="primary"
                >{{ $device.mobile ? "+" : "Add" }} all HS</a-button
              >
              <a-button
                @click="removeOwnersHotspots"
                :style="{ width: (100 - textBoxWidth) / 2 + '%' }"
                type="danger"
                >{{ $device.mobile ? "-" : "Remove" }} all HS</a-button
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
            <a-button type="danger" @click="removeAddress(hs.address)"
              ><a-icon type="delete"
            /></a-button>
          </span>
        </a-table>
      </a-col>
      <div style="text-align: center">
        <a-button type="danger" @click="loadData">Load Data</a-button>
        <a-button type="primary"
          ><download-excel
            :data="rewardsExcellable"
            :name="new Date().toLocaleDateString()"
            :fields="jsonFields"
            worksheet="Main"
            default-value="N/A"
            :header="excelName"
            footer="Exported via https://github.com/MrDanaT/helium-hotspot-dashboard"
            >Convert To Excel</download-excel
          ></a-button
        >
        <a-row type="flex" justify="start">
          <a-col v-for="reward in rewards" :key="reward[0]">
            <a-card :title="reward[0]">
              <table
                v-for="hs in reward.slice(1)"
                :key="hs.name"
                style="border: 0.05rem solid black"
              >
                <tr>
                  <th>{{ normalise(hs.name) }}</th>
                </tr>
                <tr
                  @click="copyToClipboard(convertToComma(hs.total))"
                  style="color: blue"
                >
                  <td>{{ convertToComma(hs.total) }}</td>
                </tr>
              </table>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-row>
  </div>
</template>

<script>
import moment from "moment";
import Vue from "vue";

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

export default {
  name: "App",
  data() {
    return {
      hotspotDict: [],
      hotspotAPIUrl: "https://api.helium.io/v1/hotspots",
      datePicked: moment(this.currDay).days(-3),
      inputHotspotAddress: "",
      inputOwnerAddress: "",
      textBoxWidth: this.$device.mobile ? 40 : 80,
      rewards: [],
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
      return this.getStartOfGivenDay(new Date(new Date().toISOString()));
    },
    allDates() {
      const dateArray = new Array();
      let currentDate = this.getStartOfGivenDay(this.datePicked.toDate());
      while (currentDate < this.currDay) {
        dateArray.push(new Date(currentDate));
        currentDate = currentDate.addDays(1);
      }
      return dateArray;
    },
    columns() {
      const results = [
        {
          title: "Name",
          dataIndex: "name",
          scopedSlots: {
            customRender: "name",
          },
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
          title: "Last Day Earned (HNT)",
          dataIndex: "lastDayEarned",
          ellipsis: this.$device.mobile,
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

      if (!this.$device.mobile) {
        results.splice(1, 0, {
          title: "Reward Scale",
          dataIndex: "reward_scale",
          ellipsis: true,
        });
        results.splice(3, 0, {
          title: "Sync Percentage (%)",
          dataIndex: "syncPercentage",
          ellipsis: true,
        });
      }

      return results;
    },
    addressAutocomplete() {
      const result = this.hotspotDict
        .filter((hs) => {
          return hs.address.includes(this.inputHotspotAddress);
        })
        .map((hs) => {
          return hs.address;
        });
      return result;
    },
    ownerAutocomplete() {
      const result = this.hotspotDict
        .filter((hs) => {
          return hs.owner?.includes(this.inputOwnerAddress);
        })
        .map((hs) => {
          return hs.owner;
        });
      return [...new Set(result)];
    },
    rewardsExcellable() {
      const result = this.rewards.map((arr) => {
        const [, ...rest] = arr;
        let res = {
          date: arr[0],
        };
        if (rest.length > 0) {
          res = {
            ...res,
            ...rest.reduce(
              (a, v) => ({
                ...a,
                [v.name]: this.convertToComma(v.total),
              }),
              {}
            ),
          };
        }
        return res;
      });
      return result;
    },
    jsonFields() {
      let res = this.hotspotDict.map((hs) => {
        return hs["name"];
      });
      res = {
        Date: "date",
        ...res.reduce((a, v) => ({ ...a, [v]: v }), {}),
      };
      return res;
    },
    excelName() {
      const format = "DD/MM/YYYY";
      const currDay = moment(this.currDay);
      return `Export of rewards between ${this.datePicked.format(
        format
      )}-${currDay.format(format)}`;
    },
  },
  methods: {
    convertToComma(txt) {
      return txt.toString().replace(".", ",");
    },
    async copyToClipboard(txt) {
      try {
        await navigator.clipboard.writeText(txt);
        this.openNotification(
          "Succesful",
          "Reward has been copied.",
          "success"
        );
      } catch ($e) {
        this.openNotification("Cannot copy reward.", $e, "error");
      }
    },
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
        duration: 3,
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
              `${isAdded} hotspot${isAdded > 1 ? "s" : ""} ${
                isAdded > 1 ? "have" : "has"
              } been added.`,
              "success"
            );
          }
          if (isIgnored > 0) {
            this.openNotification(
              `Cannot add hotspot${isIgnored > 1 ? "s" : ""}`,
              `${isIgnored} hotspot${isIgnored > 1 ? "s" : ""} ${
                isIgnored > 1 ? "are" : "is"
              } already in the list.`,
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
    removeOwnersHotspots() {
      const rest = this.hotspotDict.filter(
        (hs) => hs.owner !== this.inputOwnerAddress
      );
      const remainingCount = this.hotspotDict.length - rest.length;
      if (remainingCount > 0) {
        this.openNotification(
          "Succesful",
          `${remainingCount} hotspot${remainingCount > 1 ? "s" : ""} ${
            remainingCount > 1 ? "have" : "has"
          } been removed.`,
          "success"
        );
        this.hotspotDict = rest;
        this.inputOwnerAddress = "";
      }
    },
    loadData() {
      this.rewards.splice(0);
      this.allDates.forEach((date) => {
        const what = new Array();
        what.push(date.toLocaleDateString());
        this.hotspotDict.forEach((hs) => {
          this.rewardCall(
            hs.address,
            this.getStartOfGivenDay(date),
            this.getEndOfGivenDay(date)
          ).then(({ data }) => {
            what.push({ name: hs.name, total: data.total });
          });
        });
        this.rewards.push(what);
      });
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
  height: 2.5rem;
  background: black;
  color: white;
  text-align: center;
  vertical-align: middle;
  padding: 10px;
}
</style>
