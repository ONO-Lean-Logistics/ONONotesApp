<template>
  <div class="options">
    <div>
      <button @click="toggleShowAccountManagement()" class="group-button">
        <h2>Options</h2>
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
        showAccountManagement: false
      },
      searchQuery: '',
      nextId: 1,
      isAdminUser: false // Flag to check if the user is an admin
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
          group.members.some(member => member.text === this.utente) &&
          group.title !== 'Users'
        );
      }

      return filteredGroups;
    }
  },
  created() {
    this.refreshGroupsQuery();
  },
  methods: {
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
    async refreshGroupsQuery() {
      try {
        const response = await loadGroups();
        if (response && response.groups) {
          this.account.groups = response.groups;
          this.nextId = Math.max(...this.account.groups.map(group => group.id)) + 1;

          // Update the admin status
          this.isAdminUser = this.isAdmin;
        } else {
          this.account.groups = [];
          this.nextId = 1;
        }
      } catch (error) {
        console.error("Error refreshing groups query:", error);
        this.account.groups = [];
      }
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
  background-color: var(--note-background-color); 
}
.options button.group-button {
  position: relative;
  padding: 8px 16px;
  font-size: 14px;
  background-color: #283442;
  color: #D9DADC;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.group-container {
  min-height: 120px;
  width: 100%;
  max-width: 300px; 
  margin-bottom: 20px;
  cursor: grab;
  display: block;
  justify-content: center;
  background-color: transparent;
  color: var(note-text-color);
  overflow: hidden;
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
  justify-content: absolute;
  justify-content: center;
  align-items: center;
  z-index: 999; /* Ensures the modal is above everything else */
  cursor: default;
}
.account-content {
  background-color: var(--note-background-color); /* Use your custom note background color */
  color: var(--note-text-color); /* Use your custom note text color */
  border: 1px solid transparent;
  padding: 20px;
  width: 80%;
  max-width: 600px;
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
  background-color: #b9b9b92f;
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
