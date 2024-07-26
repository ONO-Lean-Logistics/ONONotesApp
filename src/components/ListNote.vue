<template>
  <!-- Display note content when not editing -->
  <div
    v-if="!isEditing"
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
            @click.stop
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
    <!-- Delete Button -->
    <button
      v-if="showEditIcon && !isEditing"
      class="delete-btn"
      @click.stop="deleteNote"
    >
      <i class="fa-solid fa-trash-can"></i>
    </button>
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
      <!-- Input and Button to add new item -->
      <div class="add-item-container">
        <button @click="toggleAddInput" class="add-btn">
          <i class="fa-solid fa-plus"></i>
        </button>
        <input
          v-if="showAddInput"
          type="text"
          v-model="newItemText"
          @keyup.enter="handleKeyup"
          placeholder="Add new item"
          class="new-item-input"
        />
      </div>
      <!-- Edit actions buttons -->
      <div class="edit-actions">
        <button class="delete-btn-modal" @click.stop="deleteNote">
          <i class="fa-solid fa-trash-can"></i>
        </button>
        <button @click.stop="cancelEdit" class="cancel-btn">
          <img src="../assets/X_icon.svg" alt="Clear" />
        </button>
        <button @click.stop="saveEdit" class="save-btn">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
import { loadNotes, saveNotes, updateNotes } from "../api/apiService.js";

export default {
  name: "ListNote",
  props: {

    items: {
      type: Array,
      required: true,
      default: () => []
    },

    noteId: {
      type: [String, Number],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    timestamp: {
      type: [String, Number],
      required: true,
    },

    type: {
      type: String,
      required: true,
      validator(value) {
        return ["classic", "list"].includes(value);
      },
    },

    utente: {
      type: String,
      required: true,
    },

  },

  data() {
    return {
      newTitle: this.title,
      newItems: this.items.map((item) => ({ ...item })),
      newItemText: "", // New data property for the new item text input
      isEditing: false,
      showEditIcon: false,
      maxTitleLength: 25, // Default char limit per title
      maxCharsPerLine: 28, // Default char limit per line
      formattedTimestamp: "",
      hoverIndex: null,
      showAddInput: false, // Track whether to show the new item input
    };
  },
  
  watch: {
    // Update newItems when items prop changes
    items(newVal) {
      this.newItems = newVal.map((item) => ({ ...item }));
    },
    // Update newTitle when title prop changes
    title(newVal) {
      this.newTitle = newVal;
    },
    // Update formattedTimestamp when timestamp prop changes
    timestamp(newVal) {
      this.formattedTimestamp = this.formatTimestamp(newVal);
    },
  },
  mounted() {
    // Format timestamp on component mount
    this.formattedTimestamp = this.formatTimestamp(this.timestamp);
    this.isEditing = false;
  },

  methods: {

    // Cancel editing
    cancelEdit() {
      this.newTitle = this.title;
      this.newItems = this.items.map((item) => ({ ...item }));
      this.isEditing = false;
      this.showEditIcon = false;
      this.$emit("save");
    },
    
    // Delete note
    async deleteNote() {
      try {
        const { notes } = await loadNotes();
        const updatedNotes = notes.filter((note) => note.id !== this.noteId);
        await saveNotes(updatedNotes, false);
        this.isEditing = false;
        this.showEditIcon = false;
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
      this.$emit("save");
    },

    // Format timestamp to readable format
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

    // Generate unique ID
    generateUniqueId(prefix, index = "") {
      return `${prefix}-${this._uid}-${index}`;
    },

    // Handle click outside modal
    handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        this.saveEdit();
        this.isEditing = false;
      }
    },

    // Handle keyup event for adding item
    handleKeyup(event) {
      if (event.key === "Enter" && this.newItemText.trim()) {
        this.newItems.push({ text: this.newItemText, completed: false });
        this.newItemText = ""; // Clear input after adding
        this.showAddInput = false;
      }
    },

    // Remove item
    removeItem(index) {
      this.newItems.splice(index, 1);
    },

    // Save edited note
    async saveEdit() {
      const editedNote = {
        id: this.noteId,
        title: this.newTitle,
        items: this.newItems,
        timestamp: Date.now(),
        utente: this.utente,
        type: this.type,
      };

      try {
        await updateNotes(this.noteId, editedNote); // Update the specific note
        this.isEditing = false;
        this.showEditIcon = false;
      } catch (error) {
        console.error("Failed to save note:", error);
      }
      this.$emit("save");
    },

    // Start editing
    startEdit() {
      this.isEditing = true;
    },

    // Toggle add item input visibility
    toggleAddInput() {
      this.showAddInput = !this.showAddInput;
      if (this.showAddInput) {
        this.$nextTick(() => this.$refs.newItemInput.focus());
      }
    },

    // Toggle completion status of item
    toggleItemCompleted(index) {
      if (this.items[index]) {
        this.items[index].completed = !this.items[index].completed;
      }
    },

    // Truncate text to fit max characters per line
    truncatedText(text) {
      if (text.length <= this.maxCharsPerLine) {
        return text;
      } else {
        return text.substring(0, this.maxCharsPerLine) + "...";
      }
    },
  },
};
</script>

<style scoped>
@import "../assets/main.css";

.add-btn {
  color: #4caf50;
  background-color: transparent;
  border-color: transparenT;
  cursor: pointer;
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

.delete-btn-modal {
  position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
  bottom: 5px;
  right: 80px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: #b9b9b92f;
  border-radius: 0;
  transition: background-color 0.3s ease;
}

.delete-btn {
  position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
  top: 5px;
  right: 5px;
  font-size: 8px;
  padding: 4px 9px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: #b9b9b92f;
  border-radius: 0;
  transition: background-color 0.3s ease;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.edit-actions button {
  margin-left: 10px;
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

/* Checkbox styling */
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

.item-container {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: flex-start; /* Align items to the left */
}

/* Text styling */
.item-text {
  font-size: 16px;
  flex: 1; /* To make item text take remaining space */
}

/* Style for list items */
li {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Ensure items are spaced evenly */
  margin-bottom: 10px; /* Adjust as needed */
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
  background-color: var(
    --note-background-color
  ); /* Use your custom note background color */
  color: var(--note-text-color); /* Use your custom note text color */
  border: 1px solid transparent;
  padding: 20px;
  width: 80%;
  max-width: 600px;
  position: relative;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-20px);
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
  width: 100%; /* Note takes full width of its container */
  max-width: 700px;
  display: block;
  align-items: center;
  justify-content: center;
  position: relative; /* Ensure position relative for absolute icon */
  user-select: none;
}

.note-content {
  white-space: pre-wrap;
  max-width: 100%;
}

.note:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Placeholder styling */
::placeholder {
  color: #ccc;
  font-style: italic;
  font-weight: 300;
  font-size: 14px;
  opacity: 1;
}

.placeholder {
  color: #aaa; /* Placeholder color */
  font-style: italic;
}

.remove-btn {
  color: red;
  background-color: transparent;
  border-color: transparent;
  cursor: pointer;
}

.save-btn {
  position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
  bottom: 5px;
  right: 5px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: #b9b9b92f;
  border-radius: 0;
  transition: background-color 0.3s ease;
}

.save-btn:hover,
.delete-btn-modal:hover {
  background-color: #b9b9b9c5; /* Colore di sfondo al passaggio del mouse */
}

.timestamp {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 8px;
}

.type {
  color: rgb(196, 196, 196);
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 8px;
}

ul {
  list-style-type: none;
  padding-left: 0; /* Remove default padding */
}

.utente {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 5px;
  left: 5px;
  font-size: 8px; /* Adjust the font size as needed */
}
</style>