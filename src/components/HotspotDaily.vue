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
import Vue from 'vue'

export default {
    name: 'HotspotDaily'
}
</script>