<template>
  <div v-if="!editing && isAdmin" class="group" @click.stop="startEdit" @mouseover="showEditIcon = true" @mouseleave="showEditIcon = false">
    <div class="group-content">
      <h2 v-if="newTitle">{{ newTitle }}</h2>
      <h3 v-else class="placeholder">Title</h3>
    </div>
  </div>

  <div v-else class="modal" @click="handleClickOutside">
    <div class="modal-content">
      <input
        v-model="newTitle"
        placeholder="Title"
        class="edit-title"
        :id="generateUniqueId('title-input')"
        :maxlength="maxTitleLength"
      />
      <ul>
        <li v-for="(member, idx) in newMembers" :key="idx">
          <div
            @mouseover="hoverIndex = idx"
            @mouseleave="hoverIndex = null"
            class="item-container"
          >
            <input
              v-model="newMembers[idx].text"
              class="edit-textarea"
              :id="generateUniqueId('item-input', idx)"
              placeholder="Enter member here"
              ref="itemInputs"
              @blur="removeEmptyMember(idx)"
            />
            <button
              v-if="hoverIndex === idx"
              @click.stop="removeMember(idx)"
              class="remove-btn"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </li>
      </ul>
      <button @click="addMember" class="add-btn">
        <i class="fa-solid fa-plus"></i>
      </button>
      <div class="edit-actions">
        <button class="delete-btn-modal" @click.stop="deleteGroup">
          <img src="../assets/delete.svg" alt="Delete" />
        </button>
        <button @click.stop="cancelEdit" class="cancel-btn">
          <img src="../assets/X_icon.svg" alt="Cancel" />
        </button>
        <button @click.stop="saveEdit" class="save-btn">
          <img src="../assets/save.svg" alt="Save" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { loadGroups, saveGroups, updateGroups } from '../api/apiService';

export default {
  props: {
    groupId: {
      type: [String, Number],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    utente: {
      type: String,
      required: true,
      default: ''
    },
    members: {
      type: Array,
      required: true,
      default: () => []
    },
    timestamp: {
      type: [String, Number],
      default: new Date().toISOString()
    },
    type: {
      type: String,
      default: 'Default Type'
    }
  },
  data() {
    return {
      newTitle: this.title,
      newMembers: this.members.map(member => ({ text: member.text || '' })),
      editing: false,
      showEditIcon: false,
      hoverIndex: null,
      maxTitleLength: 50
    };
  },
  computed: {
    formattedTimestamp() {
      const date = new Date(this.timestamp);
      return date.toLocaleString();
    }
  },
  methods: {
    isAdmin(){
      this.$emit("admin")
    },
    async saveEdit() {
      const filteredMembers = this.newMembers.filter(member => member.text.trim() !== '');
      const editedGroup = {
        id: this.groupId,
        title: this.newTitle,
        members: filteredMembers,
        timestamp: this.timestamp,
        type: this.type
      };

      try {
        await updateGroups(this.groupId, editedGroup);
        this.editing = false;
        this.showEditIcon = false;
        this.$emit('refresh');
      } catch (error) {
        console.error("Failed to save group", error);
      }
    },
    async deleteGroup() {
      try {
        const { groups } = await loadGroups();
        const updatedGroups = groups.filter(group => group.id !== this.groupId);
        await saveGroups(updatedGroups);
        this.editing = false;
        this.$emit('refresh');
      } catch (error) {
        console.error("Failed to delete group:", error);
      }
    },
    cancelEdit() {
      this.newTitle = this.title;
      this.newMembers = this.members.map(member => ({ text: member.text || '' }));
      this.editing = false;
      this.showEditIcon = false;
      this.$emit('refresh');
    },
    generateUniqueId(prefix, index = "") {
      return `${prefix}-${this._uid}-${index}`;
    },
    startEdit() {
      this.editing = true;
    },
    addMember() {
      this.newMembers.push({ text: '' });
    },
    removeEmptyMember() {
      this.newMembers = this.newMembers.filter(member => member.text.trim() !== '');
    },
    removeMember(idx) {
      this.newMembers.splice(idx, 1);
    },
    handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        this.cancelEdit();
      }
    },
  }
}
</script>

<style scoped>
:root {
  --note-background-color: #2c2f38; /* Colore di sfondo delle card */
  --note-text-color: #ffffff; /* Colore del testo principale */
  --accent-color: #4caf50; /* Colore accentato per pulsanti e link */
  --placeholder-color: #888888; /* Colore del testo segnaposto */
  --border-radius: 8px; /* Raggio del bordo per elementi arrotondati */
  /* --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); Ombra per profondità */
}

/* Main Container */
.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #1a1d23; /* Background principale */
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
}

/* Barra di Navigazione */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 20px;
  background-color: #1a1d23;
  /* box-shadow: var(--box-shadow); */
  margin-bottom: 20px;
}

.navbar img {
  height: 40px; /* Altezza logo */
}

.navbar .nav-buttons {
  display: flex;
  gap: 10px;
}

.navbar button {
  background: none;
  border: none;
  color: var(--note-text-color);
  cursor: pointer;
  font-size: 18px;
  transition: color 0.2s ease;
}

.navbar button:hover {
  color: var(--accent-color);
}

/* Barra di Ricerca */
.search-bar {
  display: flex;
  align-items: center;
  background-color: #2c2f38;
  border-radius: var(--border-radius);
  padding: 5px 10px;
  width: 100%;
  max-width: 600px;
  /* box-shadow: var(--box-shadow); */
}

.search-bar input {
  flex-grow: 1;
  background: none;
  border: none;
  color: var(--note-text-color);
  padding: 8px;
  font-size: 16px;
  outline: none;
}

.search-bar button {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  font-size: 24px;
  transition: color 0.2s ease;
}

.search-bar button:hover {
  color: darken(var(--accent-color), 10%);
}

/* Options Grid Container */
.options-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Adjust minmax for responsiveness */
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  border-radius: var(--border-radius);
}

/* Group Card Styles */
.group {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  padding: 15px;
  border-radius: var(--border-radius);
  /* box-shadow: var(--box-shadow); */
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;
}

.group:hover {
  transform: translateY(-5px);
  /* box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15); */
}

.group-content {
  width: 100%;
}

.group-content h2 {
  font-size: 18px;
  margin-bottom: 5px;
  font-weight: 600;
  color: var(--note-text-color);
}

.group-content .item-text {
  font-size: 14px;
  color: var(--note-text-color);
}

.group-content .placeholder {
  color: var(--placeholder-color);
  font-size: 14px;
  font-style: italic;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  padding: 20px;
  border-radius: var(--border-radius);
  width: 90%;
  max-width: 500px;
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* box-shadow: var(--box-shadow); */
  position: relative;
}

/* Close Button */
.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: transparent;
  border: none;
  color: var(--accent-color);
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

/* List Styles */
ul {
  padding: 0;
  margin: 0;
  list-style: none; /* Remove default list style */
}

li {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 30px; /* Adjust based on icon size */
  margin-bottom: 10px;
}

li::before {
  content: '•'; /* Custom marker */
  font-size: 20px;
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%); /* Center marker vertically */
  color: var(--accent-color);
}

/* Add Button */
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color:  #4caf50;
  background-color: var(--accent-color);
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: background-color 0.2s ease;
  position: absolute;
  bottom: 15px;
  left: 8px;
}

.add-btn:hover,
.add-btn:focus {
  background-color: darken(var(--accent-color), 10%);
}

/* Remove Button */
.remove-btn {
  background: none;
  border: none;
  color: red;
  cursor: pointer;
  margin-left: 10px;
  transition: color 0.2s ease;
}

.remove-btn:hover,
.remove-btn:focus {
  color: darkred;
}

/* Editable Title */
.edit-title {
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid var(--placeholder-color);
  border-radius: var(--border-radius);
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  transition: border-color 0.2s ease;
}

.edit-title:focus {
  border-color: var(--accent-color);
  outline: none;
}

/* Editable Text Area */
.edit-textarea {
  width: 100%;
  font-size: 16px;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid var(--placeholder-color);
  border-radius: var(--border-radius);
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.edit-textarea:focus {
  border-color: var(--accent-color);
  outline: none;
}

/* Cancel Button */
.cancel-btn {
  background: none;
  border: none;
  margin-left: 10px;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  color: var(--accent-color);
  transition: color 0.2s ease;
}

.cancel-btn:hover {
  color: darken(var(--accent-color), 10%);
}

/* Edit Actions */
.edit-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 20px;
}

/* Delete and Save Buttons */
.delete-btn-modal,
.save-btn {
  background: none;
  border: none;
  margin-left: 10px;
  cursor: pointer;
  color: var(--accent-color);
  transition: color 0.2s ease;
}

.delete-btn-modal:hover,
.save-btn:hover {
  color: darken(var(--accent-color), 10%);
}

</style>
