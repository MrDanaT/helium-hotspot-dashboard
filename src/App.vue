<template>
  <div id="app">
    <a-row>
      <a-col
        ><a-card
          title="User input data"
          style="width: 30%; border-width: 1px; border-color: black"
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
                  >Add all HS</a-button
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
                :style="{ width: 100 - textBoxWidth + '%' }"
                type="primary"
                >Add HS</a-button
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
        <a-table
          :columns="columns"
          :data-source="mappedHotspots"
          :row-key="(hs) => hs.address"
          :name="counter"
          :pagination="true"
          bordered
        >
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
          </span></a-table
        >
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
  },
  {
    title: "Status",
    dataIndex: "online",
    scopedSlots: {
      customRender: "status",
    },
  },
  {
    title: "Sync Percentage (%)",
    dataIndex: "syncPercentage",
  },
  {
    title: "Last Day Earned (HNT)",
    dataIndex: "lastDayEarned",
    ellipsis: true,
  },
];

export default {
  name: "App",
  components: {},
  data() {
    return {
      hotspotDict: [],
      hotspotAPIUrl: "https://api.helium.io/v1/hotspots",
      startDate: moment(new Date() - 7),
      inputHotspotAddress: "",
      inputOwnerAddress: "",
      textBoxWidth: 80,
      columns,
      counter: 0,
    };
  },
  computed: {
    mappedHotspots() {
      return this.hotspotDict;
    },
  },
  methods: {
    findIndexOf(nameOrAddress) {
      console.log("FIND: ", nameOrAddress, "IN: ", this.hotspotDict);
      const idx = this.hotspotDict.findIndex(
        (hs) => hs.name === nameOrAddress || hs.address === nameOrAddress
      );

      return idx;
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
    convertAPIHotspotToMyHotspot(data) {
      return {
        online: data.status.online,
        height: data.status.height || 0,
        reward_scale: data?.reward_scale?.toFixed(2) || 0,
        name: data.name,
        syncPercentage: ((data?.status?.height / data.block) * 100).toFixed(2),
        address: data.address,
      };
    },
    async processHotspot(hotspotAddress) {
      await Vue.axios
        .get(`${this.hotspotAPIUrl}/${hotspotAddress}`)
        .then(({ data }) => {
          data = data.data;
          this.hotspotDict.push(this.convertAPIHotspotToMyHotspot(data));
        });
    },
    openNotification(message, description, type) {
      this.$notification[type]({
        message,
        description,
      });
    },
    removeFromHotspots() {
      let idx = this.hotspotNames.findIndex(
        (hs) => hs === this.inputHotspotAddress
      );
      if (idx < 0)
        idx = this.hotspotAddresses.findIndex(
          (hs) => hs === this.inputHotspotAddress
        );

      if (idx < 0) return;

      this.hotspotAddresses.splice(idx, 1);
      this.inputHotspotAddress = "";
    },
    async getOwnersHotspots() {
      try {
        let res = await Vue.axios({
          url: `https://api.helium.io/v1/accounts/${this.inputOwnerAddress}/hotspots`,
          method: "get",
          timeout: 8000,
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.status == 200) {
          return res.data.data.map((hs) =>
            this.convertAPIHotspotToMyHotspot(hs)
          );
        }
      } catch (err) {
        this.openNotification(
          "Cannot add hotspot",
          "Address is wrong.",
          "error"
        );
      }
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
    removeOwnersHotspots() {
      this.getOwnersHotspots().then((arr) => {
        arr.forEach((element) => {
          const idx = this.hotspotAddresses.findIndex((x) => x === element);
          if (idx < 0) return;
          this.hotspotAddresses.splice(idx, 1);
          this.inputOwnerAddress = "";
        });
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
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
