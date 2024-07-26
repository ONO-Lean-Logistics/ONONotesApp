<template>
  <div class="button-group" ref="buttonGroup">
    <button
      class="btn btn-primary"
      :class="{ active: selectedType === 'Time' }"
      @click="toggleType"
      :disabled="isOccupied"
    >
      {{ selectedType }}
    </button>

    <button
      class="btn btn-primary"
      :class="{ active: (selectedOrder === 'Recent' || selectedOrder === 'Most') }"
      @click="toggleOrder"
      :disabled="isOccupied"
    >
      {{ selectedOrder }}
      <span v-if="selectedOrder === 'Recent'"> ⭡</span>
      <span v-if="selectedOrder === 'Oldest'"> ⭣</span>
      <span v-if="selectedOrder === 'Most'"> ⭡</span>
      <span v-if="selectedOrder === 'Least'"> ⭣</span>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    isOccupied: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedType: localStorage.getItem("sortType") || "Time", 
      selectedOrder: localStorage.getItem("sortOrder") || "Oldest", 
    };
  },
  
  methods: {
    toggleType() {
      this.selectedType = this.selectedType === "Time" ? "Length" : "Time";
      localStorage.setItem("sortType", this.selectedType);
      this.$emit("select-sort-type", this.selectedType);
    },
    toggleOrder() {
      if (this.selectedType === 'Time') {
        this.selectedOrder = this.selectedOrder === "Recent" ? "Oldest" : "Recent";
      } else if (this.selectedType === 'Length') {
        this.selectedOrder = this.selectedOrder === "Most" ? "Least" : "Most";
      }
      localStorage.setItem("sortOrder", this.selectedOrder);
      this.$emit("select-sort-order", this.selectedOrder);
    },
  },
};
</script>

<style scoped>
.button-group {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  font-size: 14px;
  background-color: #7c7c7c00;
  color: #9c9c9c;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.btn:hover{
  background-color: #72707075}
.btn.active span {
  font-weight: bold;
}
</style>
