<template>
  <div class="groups-and-other">
    <div class="options">
      <div>
        <button @click="toggleShowAccountManagement()" class="group-button">
          <img src="../assets/settings.svg" alt="Clear" />
        </button>
        <div v-if="account.showAccountManagement" class="account-management" @click="handleClickOutside">
          <div class="account-content">
            <h2>Username: {{ utente }}</h2>
            <button @click="toggleShowAccountManagement()" class="clear-button">
              <img src="../assets/X_icon.svg" alt="Clear" />
            </button>

            <br>
            <div class="divider" :class="'divider-dark'"></div>
            <br>
            <div class="groups-header">
              <h1>Groups: </h1>
              <button v-if="isAdmin" @click="addGroup" class="group-btn">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
            <div class="groups">
              <div class="groups-grid">
                <div 
                  v-for="group in filteredGroups"
                  :key="group.id"
                  class="group-container"
                >
                  <Group
                    :groupId="group.id"
                    :title="group.title"
                    :utente="group.utente"
                    :members="group.members"
                    @refresh="refreshGroupsQuery"
                    @admin="isAdmin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="select-group">
      <!-- Dropdown for selecting group -->
      <select v-model="selectedGroupId" class="group-selector" @change="onGroupChange">
        <option v-for="group in filteredGroups" :key="group.id" :value="group.id">
          {{ group.title }}
        </option>
      </select>
    </div>
  </div>
</template>

<script>
import Group from './Group.vue';
import { loadGroups, saveGroups, updateGroups } from "@/api/apiService";

export default {
  props: {
    utente: {
      type: String,
      required: true,
      default: ''
    }
  },
  components: {
    Group
  },
  data() {
    return {
      account: {
        groups: [],
        showAccountManagement: false,
      },
      searchQuery: '',
      nextId: 1,
      isAdminUser: false, // Flag to check if the user is an admin
      selectedGroupId: null, // Default group
    };
  },
  computed: {
    isAdmin() {
      // Determine if the current user is an admin
      return this.account.groups.some(group => 
        Array.isArray(group.members) &&
        group.members.some(member => member.text === this.utente) &&
        group.title === "Admins"
      );
    },
    filteredGroups() {
      let filteredGroups = this.account.groups || [];

      // Show all groups if the user is an admin
      if (this.isAdminUser) {
        filteredGroups = filteredGroups;
      } else {
        // Filter to show only groups where the user is a member and exclude the "Users" group
        filteredGroups = filteredGroups.filter(group => 
          Array.isArray(group.members) &&
          group.members.some(member => member.text === this.utente) 
        );
      }

      return filteredGroups;
    }
  },
  async created() {
    await this.refreshGroupsQuery();
  },
  methods: {
    async refreshGroupsQuery() {
      try {
        const response = await loadGroups();
        if (response && response.groups) {
          this.account.groups = response.groups;
          this.nextId = Math.max(...this.account.groups.map(group => group.id)) + 1;

          // Update the admin status
          this.isAdminUser = this.isAdmin;

          this.selectedGroupId = this.getDefaultGroupId();
          this.onGroupChange(); // Emit the default selected group ID
        } else {
          this.account.groups = [];
          this.nextId = 1;
        }
      } catch (error) {
        console.error("Error refreshing groups query:", error);
        this.account.groups = [];
      }
    },
    getDefaultGroupId() {
      // Search for the group named 'General'
      const generalGroup = this.account.groups.find(group => group.title === 'General');
      // Return the ID of the 'General' group, or a fallback value if not found
      return generalGroup ? generalGroup.id : null;
    },
    toggleShowAccountManagement() {
      this.account.showAccountManagement = !this.account.showAccountManagement;
    },
    async saveAllGroups() {
      try {
        await saveGroups(this.account.groups);
      } catch (error) {
        console.error("Error saving groups:", error);
      }
    },
    onGroupChange(){
      this.$emit('getSelectedGroup', this.selectedGroupId)
    },
    async addGroup() {
      const newGroup = {
        title: "",
        id: this.nextId,
        utente: this.utente,
        members: []
      };
      this.nextId++;
      this.account.groups.push(newGroup);
      try {
        await updateGroups(newGroup.id, newGroup);
      } catch (error) {
        console.error("Error saving the new group:", error);
      }
    },
    handleClickOutside(event) {
      if (!event.target.closest(".account-content")) {
        this.account.showAccountManagement = false;
      }
    }
  }
};
</script>

<style scoped>
.options {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  background-color: #283442; 
}
.options button.group-button {
  position: relative;
  padding: 8px 16px;
  font-size: 8px;
  background-color: #283442;
  color: #D9DADC;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  top: 8px;
  right: 4px
}
.group-container {
  min-height: 20px;
  max-width: 20px; 
  max-height: 20px;
  margin-bottom: 20px;
  cursor: grab;
  display: block;
  justify-content: center;
  background-color: transparent;
  color: var(note-text-color);
  transition: opacity 0.8s ease;
}

.account-management {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.5);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999; /* Ensures the modal is above everything else */
  cursor: default;
}
.account-content {
  background-color: var(--note-background-color); /* Use your custom note background color */
  color: var(--note-text-color); /* Use your custom note text color */
  border: 1px solid transparent;
  padding: 10px; /* Adjust padding as needed */
  width: 90%; /* Set width to 1000px */
  height: 90%; /* Set height to 300px */
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden; /* Disable horizontal scrolling */
  position: relative;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-20px);
}
.add-divider {
  border-left: 1px solid var(--add-divider-color);
  height: 120%;
  margin: 0 5px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
.clear-button {
  position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
  top: 5px;
  right: 5px;
  font-size: 8px;
  padding: 6px 12px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 0;
}
.group-container {
  min-height: 200px; /* Increased height */
  width: 100%;
  max-width: 400px; /* Increased width */
  margin-bottom: 20px;
  cursor: grab;
  display: block;
  justify-content: center;
  background-color: transparent;
  color: var(note-text-color);
  overflow: hidden;
}

.group-selector, .select-items {
  background-color: #283442;
  color: #9c9c9c;
  border: none;
  position: relative;
  top: 37px;
  right: 170px;
}
.groups-header {
  display: flex;
  align-items: center;
  text-align: center;
}
.group-btn {
  color: #4caf50;
  background-color: var(--note-background-color);
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 10px;
  margin-right: 10px;
}
.groups {
  display: flex;
  align-items: center;
}
h1 {
  font-size: 16px;
}
.groups-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 columns */
  gap: 20px;
}
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  .groups-grid {
    grid-template-columns: 1fr; /* 1 column for small screens */
  }
}
</style>


