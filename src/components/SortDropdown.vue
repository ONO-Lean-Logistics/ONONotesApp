<template>
  <div class="button-group" ref="buttonGroup">
    <button
      class="btn btn-primary"
      :class="{ active: selectedCriteria.includes('Time') }"
      @click="setSortCriteria('Time')"
      :disabled="isOccupied"
    >
      Time
      <span v-if="selectedCriteria === 'Recent'"> ⭡</span>
      <span v-if="selectedCriteria === 'Oldest'"> ⭣</span>
    </button>
    <button
      class="btn btn-primary"
      :class="{ active: selectedCriteria.includes('Length') }"
      @click="setSortCriteria('Length')"
      :disabled="isOccupied"
    >
      Length
      <span v-if="selectedCriteria === 'Most'"> ⭡</span>
      <span v-if="selectedCriteria === 'Least'"> ⭣</span>
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
      selectedCriteria: localStorage.getItem("sortCriteria") || "Oldest", // Default to "Oldest" if no criteria is set
    };
  },
  methods: {
    setSortCriteria(type) {
      if (type === "Time") {
        this.selectedCriteria =
          this.selectedCriteria === "Recent" ? "Oldest" : "Recent";
      } else if (type === "Length") {
        this.selectedCriteria =
          this.selectedCriteria === "Most" ? "Least" : "Most";
      }
      localStorage.setItem("sortCriteria", this.selectedCriteria); // Store selected criteria in localStorage
      this.$emit("select-sort-criteria", this.selectedCriteria);
    },
  },
};
</script>

<style scoped>
.button-group {
  display: flex;
  gap: 8px; /* Adjust spacing between buttons */
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

.btn:hover {
  background-color: #ebebeb1a;
}

.btn.active {
  background-color: #007bff; /* Active button background color */
  color: #fff; /* Active button text color */
}

.btn.active span {
  font-weight: bold; /* Make the arrow bold in active state */
}
</style>
