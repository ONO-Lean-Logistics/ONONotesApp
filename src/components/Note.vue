<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- Note container -->
  <div
    v-if="!isEditing"
    class="note"
    @click.stop="startEdit"
    @mouseover="showEditIcon = true"
    @mouseleave="showEditIcon = false"
  >
    <!-- Display Note Content when not editing -->
    <div v-if="!isEditing" class="note-content">
      <!-- Display title if exists, otherwise show placeholder -->
      <h2 v-if="title">{{ title }}</h2>
      <!-- Display truncated content or placeholder if empty -->
      <h3 v-else class="placeholder">Title</h3>
      <pre style="font-size: 16px" v-if="content">{{
        truncateContent(content)
      }}</pre>
      <pre v-else class="placeholder">Write a note</pre>
      <div class="utente">{{ utente }}</div>
      <div class="timestamp">{{ formattedTimestamp }}</div>
      <div class="type">{{ type }}</div>
    </div>
    <!-- Display Delete Button when hovering and not editing -->
    <button
      v-if="showEditIcon && !isEditing"
      class="delete-btn"
      @click.stop="deleteNote"
    >
    <img src="../assets/delete.svg" alt="Clear" />
    </button>
    <!-- Edit Modal -->
  </div>
  <div v-else class="modal" @click.stop="handleClickOutside">
    <div class="modal-content">
      <!-- Input for editing title -->
      <input
        v-model="newTitle"
        placeholder="Title"
        class="edit-title"
        id="titleInput"
        :maxlength="maxTitleLength"
      />
      <!-- Textarea for editing content -->
      <textarea
        v-model="newContent"
        rows="4"
        class="edit-textarea"
        id="textInput"
        placeholder="Enter content here"
        @input="handleTextareaInput"
      ></textarea>
      <!-- Edit actions: Delete, Cancel, Save buttons -->
      <div class="edit-actions">
        <button class="delete-btn-modal" @click.stop="deleteNote">
          <img src="../assets/delete.svg" alt="Clear" />
        </button>
        <button @click.stop="cancelEdit" class="cancel-btn"><img src="../assets/X_icon.svg" alt="Clear" /></button>
        <button @click.stop="saveEdit" class="save-btn"><img src="../assets/save.svg" alt="Clear" /></button>
      </div>
    </div>
  </div>
</template>

<script>
import { loadNotes, saveNotes, updateNotes } from "../api/apiService.js";

export default {
  props: {
    noteId: {
      // Added noteId prop to identify the note
      type: [String, Number],
      required: true,
    },
    title: {
      // Title of the note
      type: String,
      required: true,
    },
    content: {
      // Content of the note
      type: String,
      required: true,
    },
    utente: {
      // User who created the note
      type: String,
      required: true,
    },
    timestamp: {
      // Timestamp when note was created
      type: [String, Number],
      required: true,
    },
    type: {
      type: String,
      required: true,
      validator(value) {
        return ['classic', 'list'].includes(value);
      },
    },
  },
  data() {
    return {
      // State variables for editing
      newTitle: this.title,
      newContent: this.content,
      isEditing: false,
      showEditIcon: false,
      maxTitleLength: 25, // Default char limit per title
      maxCharsPerLine: 32, // Default char limit per line
      formattedTimestamp: "",
    };
  },
  watch: {
    // Watch for changes in title, content, and timestamp
    title(newVal) {
      this.newTitle = newVal;
    },
    content(newVal) {
      this.newContent = newVal;
    },
    timestamp(newVal) {
      this.formattedTimestamp = this.formatTimestamp(newVal);
    },
  },
  mounted() {
    // Initialize formatted timestamp on component mount
    this.formattedTimestamp = this.formatTimestamp(this.timestamp);
    this.isEditing = false;
  },
  methods: {
    async saveEdit() {
      const editedNote = {
        id: this.noteId,
        title: this.newTitle,
        content: this.newContent,
        timestamp: Date.now(),
        utente: this.utente,
        type: this.type,
      };

      try {
        // Update the note using API service

        await updateNotes(this.noteId, editedNote); // Update only the specific note
        this.showEditIcon = false;
        this.isEditing = false;
        
      } catch (error) {
        console.error("Failed to save note:", error);
      };
      this.$emit("save")
    },
    // Delete the note
    async deleteNote() {
      try {     
        // Load all notes, filter out the deleted note, and save

        const { notes } = await loadNotes();
        const updatedNotes = notes.filter((note) => note.id !== this.noteId);
        await saveNotes(updatedNotes, false);
        this.isEditing = false;
        this.$emit("save")
      } catch (error) {
        console.error("Failed to delete note:", error);
      }

    },
    cancelEdit() {
      this.newTitle = this.title;
      this.isEditing = false;
      this.showEditIcon = false;
      this.$emit("save")
    },
    startEdit() {
      this.isEditing = true;
    },
    // Handle click outside the modal to save edits
    handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        this.saveEdit();
        this.isEditing = false;
      }
    },
    // Format timestamp into a readable string
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
      const seconds = date.getSeconds().toString();
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    },
    // Truncate content to fit within specified character limit per line
    truncateContent(content, charsPerLine) {
      if (content.length > charsPerLine) {
        return content.substring(0, charsPerLine) + "...";
      } else {
        return content;
      }
    },
    // Handle textarea input to format text within specified limits
    handleTextareaInput() {
      var box = document.getElementById("textInput");
      const charlimit = this.maxCharsPerLine;
      box.onkeyup = function () {
        var lines = box.value.split("\n");
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].length <= charlimit) continue;
          var j = 0;
          var space = charlimit;
          while (j++ <= charlimit) {
            if (lines[i].charAt(j) === " ") space = j;
          }
          lines[i + 1] = lines[i].substring(space + 1) + (lines[i + 1] || "");
          lines[i] = lines[i].substring(0, space);
        }
        box.value = lines.slice(0, 10).join("\n");
      };
    },
  },
};
</script>

<style scoped>
@import "../assets/main.css";

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

ul {
  list-style-type: none;
  padding-left: 0; /* Remove default padding */
}

/* Style for list items */
li {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Ensure items are spaced evenly */
  margin-bottom: 10px; /* Adjust as needed */
}

/* Mostra solo i primi 2 elementi della lista */
ul li:nth-child(n+3) {
  display: none; /* Nasconde tutti gli elementi dopo il secondo */
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
  max-height: 70px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  line-height: 1.2em; 
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
  position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
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
  left: 5px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 0;
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
  background-color: var(--note-background-color);
  border-radius: 0;
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
