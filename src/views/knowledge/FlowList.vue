<template>
  <div class="flow-list">
    <FlowRelationGraph />
  </div>
</template>

<script setup>
import FlowRelationGraph from './FlowRelationGraph.vue'
</script>

<style scoped>
.flow-list {
  padding: 0;
  height: calc(100vh - 100px);
}
</style>
