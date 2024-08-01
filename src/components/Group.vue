<template>
    <!-- Display group content when not editing -->
    <div
      v-if="!editing && isAdmin"
      class="group"
      @click.stop="startEdit"
      @mouseover="showEditIcon = true"
      @mouseleave="showEditIcon = false"
    >
      <!-- Group Content -->
      <div class="group-content">
        <h2 v-if="newTitle">{{ newTitle }}</h2>
        <h3 v-else class="placeholder">Title</h3>
      </div>
    </div>
  
    <!-- Modal for editing -->
    <div v-else class="modal" @click="handleClickOutside">
      <div class="modal-content">
        <!-- Input for editing group title -->
        <input
          v-model="newTitle"
          placeholder="Title"
          class="edit-title"
          :id="generateUniqueId('title-input')"
          :maxlength="maxTitleLength"
        />
        <ul>
          <!-- List items for editing members -->
          <li v-for="(member, idx) in newMembers" :key="idx">
            <div
              @mouseover="hoverIndex = idx"
              @mouseleave="hoverIndex = null"
              class="item-container"
            >
              <!-- Input for editing member text -->
              <input
                v-model="newMembers[idx].text"
                class="edit-textarea"
                :id="generateUniqueId('item-input', idx)"
                placeholder="Enter member here"
                ref="itemInputs"
                @blur="removeEmptyMember(idx)"
              />
              <!-- Button to remove member -->
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
        <!-- Button to add new member -->
        <button @click="addMember" class="add-btn">
          <i class="fa-solid fa-plus"></i>
        </button>
        <!-- Edit actions buttons -->
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
        maxTitleLength: 50 // Set a default value for maxTitleLength
      };
    },
    computed: {
      formattedTimestamp() {
        const date = new Date(this.timestamp);
        return date.toLocaleString(); // Format as needed
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
/* General Styles */
.group, .group-content, .modal-content, .edit-title, .edit-textarea {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
}

.group {
  padding: 20px;
  width: 100%;
  max-width: 400px; /* Adjust as needed */
  margin-bottom: 20px;
  cursor: grab;
  position: relative;
  /* Ensure the group is not overlapped by other elements */
  z-index: 1;
}

.group-content {
  padding: 20px;
  border-radius: 8px;
  position: relative;
  /* Ensure the content has proper spacing */
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
  z-index: 1000; /* Ensure the modal is on top of other elements */
}

.modal-content {
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  position: relative;
  background-color: var(--note-background-color);
  color: var(--note-text-color);
}

.close-btn, .cancel-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: red;
  font-size: 24px;
  cursor: pointer;
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
  border: 1px solid var(--note-background-color); /* Ensure no visible border */
  border-radius: 4px; /* Optional: Add border-radius for better aesthetics */
  background-color: var(--note-background-color);
  color: var(--note-text-color);
}

.remove-btn {
  background: none;
  border: none;
  color: red;
  cursor: pointer;
  display: none; /* Hide remove button by default */
}

.add-btn {
  display: flex;
  align-items: center;
  background-color: #4caf50;
  color: #fff;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px; /* Add border-radius for consistency */
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.delete-btn-modal,
.save-btn {
  background: none;
  border: none;
  margin-left: 10px;
  cursor: pointer;
}


/* Show remove button only for the active group */
.group.active .remove-btn {
  display: block;
}

/* Optional: Add hover and focus styles for better UX */
.add-btn:hover, .add-btn:focus {
  background-color: #45a049;
}

.remove-btn:hover, .remove-btn:focus {
  color: darkred;
}

.edit-title:focus, .edit-textarea:focus {
  border-color: #888;
  outline: none;
}
</style>
