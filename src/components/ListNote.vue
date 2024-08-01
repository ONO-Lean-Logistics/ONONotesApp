
<template>
  <!-- Display note content when not editing -->
  <div
    v-if="!isEditingInternal"
    class="note"
    @click.stop="startEdit"
    @mouseover="showEditIcon = true"
    @mouseleave="showEditIcon = false"
  >
    <!-- Note Content -->
    <div class="note-content">
      <h2 v-if="title">{{ title }}</h2>
      <h3 v-else class="placeholder">Title</h3>
      <ul>
        <!-- List items -->
        <li
          v-for="(item, idx) in items"
          :key="idx"
          @click="toggleItemCompleted(idx)"
        >
          <input
            :id="generateUniqueId('checkbox', idx)"
            type="checkbox"
            v-model="item.completed"
            class="item-checkbox"
          />
          <div class="item-text" :class="{ completed: item.completed }">
            {{ truncatedText(item.text) }}
          </div>
        </li>
      </ul>
      <div class="utente">{{ utente }}</div>
      <div class="timestamp">{{ formattedTimestamp }}</div>
      <div class="type">{{ type }}</div>
    </div>
  </div>
  <!-- Modal for editing -->
  <div v-else class="modal" @click="handleClickOutside">
    <div class="modal-content">
      <!-- Input for editing title -->
      <input
        v-model="newTitle"
        placeholder="Title"
        class="edit-title"
        :id="generateUniqueId('title-input')"
        :maxlength="maxTitleLength"
      />
      <ul>
        <!-- List items for editing -->
        <li v-for="(item, idx) in newItems" :key="idx">
          <div
            @mouseover="hoverIndex = idx"
            @mouseleave="hoverIndex = null"
            class="item-container"
          >
            <!-- Checkbox for each item -->
            <input
              :id="generateUniqueId('checkbox-modal', idx)"
              type="checkbox"
              v-model="newItems[idx].completed"
              class="item-checkbox"
            />
            <!-- Input for editing item text -->
            <input
              v-model="newItems[idx].text"
              class="edit-textarea"
              :class="{ completed: item.completed }"
              :id="generateUniqueId('item-input', idx)"
              placeholder="Enter item here"
              ref="itemInputs"
              @blur="removeEmptyItem(idx)"
            />
            <!-- Button to remove item -->
            <button
              v-if="hoverIndex === idx"
              @click.stop="removeItem(idx)"
              class="remove-btn"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </li>
      </ul>
      <!-- Button to add new item -->
      <button @click="addItem" class="add-btn">
        <i class="fa-solid fa-plus"></i>
      </button>
      <!-- Edit actions buttons -->
      <div class="edit-actions">
        <button class="delete-btn-modal" @click.stop="deleteNote">
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
export default {
  name: "ListNote",
  props: {
    groupName: {
      type: String,
      required: true
    },
    noteId: {
      type: [String, Number],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      validator(value) {
        return ['classic', 'list'].includes(value);
      },
    },
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    utente: {
      type: String,
      required: true,
      default: ''
    },
    timestamp: {
      type: [String, Number],
      required: true,
    },
    isEditing: {
      type: Boolean,
      required: true,
    }
  },
  data() {
    return {
      newTitle: this.title,
      newItems: this.items.map((item) => ({ ...item })),
      isEditingInternal: this.isEditing,
      showEditIcon: false,
      hoverIndex: null,
      maxTitleLength: 25, // Default char limit per title
      maxCharsPerLine: 28, // Default char limit per line
      formattedTimestamp: this.formatTimestamp(this.timestamp),
    };
  },
  watch: {
    title(newVal) {
      this.newTitle = newVal;
    },
    items(newVal) {
      this.newItems = newVal.map((item) => ({ ...item }));
    },
    timestamp(newVal) {
      this.formattedTimestamp = this.formatTimestamp(newVal);
    },
    isEditing(newVal) {
      this.isEditingInternal = newVal;
    }
  },
  methods: {
    closeModal() {
      this.isEditingInternal = false;
      this.$emit('close-modal');
    },
    async saveEdit() {
      const filteredItems = this.newItems.filter((item) => item.text.trim() !== "");

      const editedNote = {
        id: this.noteId,
        title: this.newTitle,
        items: filteredItems,
        timestamp: Date.now(),
        utente: this.utente,
        type: this.type,
      };

      try {
        await this.$emit('update-note', { action: 'update', data: editedNote });
        this.closeModal();
      } catch (error) {
        console.error("Failed to save note:", error);
      }
    },
    async deleteNote() {
      try {
        await this.$emit('update-note', { action: 'delete', data: { id: this.noteId } });
        this.closeModal();
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
    },
    cancelEdit() {
      this.newTitle = this.title;
      this.newItems = this.items.map((item) => ({ ...item }));
      this.closeModal();
    },
    startEdit() {
      this.isEditingInternal = true;
    },
    handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        this.saveEdit();
        this.closeModal();
      }
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const day = date
        .toLocaleDateString("en-US", { day: "numeric" })
        .padStart(2, "0");
      const month = date
        .toLocaleDateString("en-US", { month: "numeric" })
        .padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    },
    truncatedText(text) {
      if (text.length <= this.maxCharsPerLine) {
        return text;
      } else {
        return text.substring(0, this.maxCharsPerLine) + "...";
      }
    },
    generateUniqueId(prefix, index = "") {
      return `${prefix}-${this._uid}-${index}`;
    },
    toggleItemCompleted(index) {
      if (this.newItems[index]) {
        this.newItems[index].completed = !this.newItems[index].completed;
      }
    },
    addItem() {
      if (this.newItems.length === 0 || this.newItems[this.newItems.length - 1].text.trim() !== "") {
        this.newItems.push({ text: "", completed: false });

        this.$nextTick(() => {
          const newItemIndex = this.newItems.length - 1;
          const newItemInput = this.$refs.itemInputs[newItemIndex];
          if (newItemInput) {
            newItemInput.focus();
          }
        });
      }
    },
    removeItem(index) {
      this.newItems.splice(index, 1);
    },
    removeEmptyItem(index) {
      if (this.newItems[index].text.trim() === "") {
        this.newItems.splice(index, 1);
      }
    },
  },
};
</script>

<style scoped>
@import "../assets/main.css";

::placeholder {
  color: #ccc;
  font-style: italic;
  font-weight: 300;
  font-size: 14px;
  opacity: 1;
}

.placeholder {
  color: #aaa;
  font-style: italic;
}

/* Modal overlay */
.modal {
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

/* Modal content */
.modal-content {
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

ul {
  list-style-type: none;
  padding-left: 0; /* Remove default padding */
  margin: 0; /* Remove default margin */
}

/* Style for list items */
li {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Ensure items are spaced evenly */
  margin-bottom: 17px;
}

/* Checkbox styling */
.item-container {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: flex-start; /* Align items to the left */
}

.item-checkbox {
  -webkit-appearance: none; /* Remove default appearance */
  -moz-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid #878a8e;
  margin-right: 10px;
  background-color: var(--note-background-color); /* Match note background */
  cursor: pointer;
}

.item-checkbox:checked {
  background-color: #40eb4696; /* Change background color when checked */
  border-color: #878a8e;
  border-width: 1.3px;
}

/* Text styling */
.item-text {
  font-size: 16px;
  flex: 1; /* To make item text take remaining space */
}

.completed {
  opacity: 0.5; /* Reduce opacity for completed items */
  text-decoration: line-through; /* Strikethrough for completed items */
}

.completed .item-checkbox {
  background-color: #40eb4696; /* Change background color when checked */
  border-color: #ffffff;
  border-width: 1.3px;
}

.completed .item-text {
  opacity: 0.5; /* Reduce opacity of text for completed items */
}

.note {
  background-color: var(--note-background-color);
  position: relative; /* Aggiungiamo posizione relativa per gestire posizione del modal */
  z-index: 1; /* Impostiamo z-index per assicurare che le note siano sopra il modal */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 1px solid transparent;
  position: relative;
  transition: box-shadow 0.3s ease;
  min-height: 120px;
  max-height: 120px;
  width: 100%; /* Note takes full width of its container */
  max-width: 700px;
  display: block;
  align-items: center;
  justify-content: center;
  position: relative; /* Ensure position relative for absolute icon */
  user-select: none;
}

.note:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.note-content {
  white-space: pre-wrap;
  max-width: 100%;
  margin-bottom: 5px; /* Increased spacing between title and list */
}

.edit-title {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  padding: 10px;
  margin-bottom: 10px;
  border: none;
  outline: none;
}

.edit-textarea {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  padding: 10px;
  resize: none;
  border: none;
  outline: none;
}

.add-btn {
  color: #4caf50;
  background-color: transparent;
  border-color: transparent;
  cursor: pointer;
}

.remove-btn {
  color: red;
  background-color: transparent;
  border-color: transparent;
  cursor: pointer;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.edit-actions button {
  margin-left: 10px;
}

.save-btn {
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 0;
}

.delete-btn-modal {
  position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
  bottom: 5px;
  right: 80px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 0;
  transition: background-color 0.3s ease;
}

.cancel-btn {
  position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
  top: 5px;
  right: 5px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 0;
}

.type {
  color: rgb(196, 196, 196);
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 8px;
}

.utente {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 5px;
  left: 5px;
  font-size: 8px; /* Adjust the font size as needed */
}

.timestamp {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 8px;
}

.type {
  position:absolute;
  top:5px;
  left:5px;
  font-size: 10px; /* Adjust the font size */
  color: rgb(196, 196, 196);
}

@media (max-width: 600px) {
  .note {
    padding: 10px;
  }

  .edit-title,
  .edit-textarea {
    font-size: 14px;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .note {
    padding: 15px;
  }
}

@media (min-width: 901px) {
  .note {
    padding: 20px;
  }
}
</style>

