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
.group, .group-content, .modal-content, .edit-title, .edit-textarea {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
}

.group {
  padding: 20px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
  cursor: grab;
  position: relative;
  z-index: 1;
}

.group-content {
  padding: 20px;
  border-radius: 8px;
  position: relative;
}

.group-content h2 {
  font-size: 20px;
  margin-bottom: 10px;
}

.group-content .item-text {
  font-size: 16px;
  margin-bottom: 10px;
}

.group-content .placeholder {
  color: #888;
}

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
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  position: relative;
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.close-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: var(--note-background-color);
  border: none;
  color: #4caf50;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

ul {
  padding: 0;
  list-style: none; /* Remove default list style */
}

li {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 30px; /* Adjust based on icon size */
}

li::before {
  content: '•'; /* Custom marker */
  font-size: 20px; /* Adjust to match the size of fa-solid fa-plus */
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%); /* Center marker vertically */
  color: var(--note-text-color); /* Match the color to your design */
}

.add-btn {
  display: flex;
  align-items: center;
  color: #4caf50;
  background-color: var(--note-background-color);
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
  position: absolute;
  bottom: 20px;
  left: 20px;
}

.remove-btn {
  background: none;
  border: none;
  color: red;
  cursor: pointer;
  display: none;
  margin-left: 10px;
}

.edit-title {
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  padding: 10px;
  margin-bottom: 10px;
  border: none;
  outline: none;
  background-color: var(--note-background-color);
  color: var(--note-text-color);
}

.edit-textarea {
  font-size: 16px;
  padding: 8px;
  margin-right: 10px;
  border: 1px solid var(--note-background-color);
  border-radius: 4px;
  background-color: var(--note-background-color);
  color: var(--note-text-color);
}

.cancel-btn {
  background: none;
  border: none;
  margin-left: 10px;
  cursor: pointer;
  position: absolute;
  top: 18px;
  right: 18px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 10px;
}

.delete-btn-modal,
.save-btn {
  background: none;
  border: none;
  margin-left: 10px;
  cursor: pointer;
  color: var(--note-text-color);
}

.group.active .remove-btn {
  display: block;
}

.add-btn:hover, .add-btn:focus {
  background-color: var(--note-background-color);
}

.remove-btn:hover, .remove-btn:focus {
  color: darkred;
}

.edit-title:focus, .edit-textarea:focus {
  border-color: #888;
  outline: none;
}
</style>
