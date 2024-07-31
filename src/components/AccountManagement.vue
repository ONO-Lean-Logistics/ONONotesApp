<template>
  <div class="options">
    <div>
      <button @click="toggleShowAccountManagement()" class="group-button">
        <h2>Options</h2>
      </button>
      <div v-if="account.showAccountManagement" class="account-management" @click="handleClickOutside">
        <div class="account-content">
          <h2>Manage Account</h2>
          <button @click="toggleShowAccountManagement()" class="clear-button">
            <img src="../assets/X_icon.svg" alt="Clear" />
          </button>
          <br>
          <div class="user-div">
            <h1>Username: {{ utente }}</h1>
          </div>
          <br><h1>Groups: </h1>
            <button v-if="isAdmin" @click="addGroup()" class="group-btn">
              <i class="fa-solid fa-plus"></i>
            </button>
          <div class="divider" :class="'divider-dark'"></div>
          <br>
          <div class="groups">
            <div class="groups-grid">
              <div 
                v-for="(group, index) in filteredGroups"
                :key="group.id"
                class="group-container"
              >
                <Group
                  :groupId="group.id"
                  :title="group.title"
                  :utente="group.utente"
                  :members="group.members"
                  :isAdmin="isAdmin"
                  @refresh="refreshGroupsQuery()"
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
      nextId: 1
    };
  },
  computed: {
    isAdmin() {
      // Check if groups are initialized
      const groups = this.account.groups || [];
      return groups.some(group =>
        group.members && group.members.some(member => member.text === this.utente && group.title === "Admins")
      );
    },
    filteredGroups() {
      const query = this.searchQuery.toLowerCase().trim();
      if (!query) return this.account.groups;

      return (this.account.groups || []).filter((group) => {
        const nameMatch = group.title.toLowerCase().includes(query);
        const utenteMatch = group.utente.toLowerCase().includes(query);
        return nameMatch || utenteMatch;
      });
    }
  },
  created() {
    this.refreshGroupsQuery();
  },
  methods: {
    updateAccount() {
      console.log('Account updated:', this.account);
    },
    handleClickOutside(event) {
      if (!event.target.closest(".account-content")) {
        this.account.showAccountManagement = false;
      }
    },
    switchToGroups() {
      this.account.group = !this.account.group;
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
    startSearch() {
      if (this.searchQuery.trim() !== "") {
        this.search();
      }
    },
    async refreshGroupsQuery() {
      try {
        const response = await loadGroups();
        if (response && response.groups) {
          let resGroups = response.groups;
          if (resGroups && Array.isArray(resGroups) && resGroups.length > 0) {
            resGroups = resGroups.filter(group => group && group.id !== null);
          }
          if (resGroups != null && resGroups.length > 0) {
            this.account.groups = resGroups;
            this.nextId = Math.max(...this.account.groups.map(group => group.id)) + 1;
          } else {
            this.account.groups = [];
          }
        } else {
          console.error("No valid groups data returned");
          this.account.groups = [];
          this.nextId = 1;
        }
      } catch (error) {
        console.error("Error refreshing groups query:", error);
        this.account.groups = [];
      }
    },
    async addGroup() {
      if (!this.isAdmin) return; // Only admins can add groups
      
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
  color: var(--note-text-color);
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
  justify-content: center;
  align-items: center;
  z-index: 999;
  cursor: default;
}
.account-content {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
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
  position: absolute;
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
  min-height: 200px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
  cursor: grab;
  display: block;
  justify-content: center;
  background-color: transparent;
  color: var(--note-text-color);
  overflow: hidden;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  .groups-grid {
    grid-template-columns: 1fr;
  }
}
</style>
