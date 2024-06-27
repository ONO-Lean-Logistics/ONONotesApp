<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    v-if="!isEditing"
    class="note"
    @click.stop="startEdit"
    @mouseover="showEditIcon = true"
    @mouseleave="showEditIcon = false"
  >
    <!-- Note Content -->
    <div v-if="!isEditing" class="note-content">
      <h3 v-if="title">{{ title }}</h3>
      <h3 v-else class="placeholder">Title</h3>
      <pre v-if="content">{{ truncateContent(content, getCharLimit) }}</pre>
      <pre v-else class="placeholder">Write a note</pre>
      <div class="utente">{{ utente }}</div>
      <div class="timestamp">{{ formattedTimestamp }}</div>
    </div>
    <!-- Delete Button -->
    <button
      :disabled="isOccupied"
      v-if="showEditIcon && !isEditing"
      class="delete-btn"
      @click.stop="deleteNote"
    >
      <i class="fa-solid fa-trash-can"></i>
    </button>
    <!-- Edit Modal -->
  </div>
  <div v-else class="modal" @click.stop="handleClickOutside">
    <div class="modal-content">
      <input
        v-model="newTitle"
        placeholder="Title"
        class="edit-title"
        id="titleInput"
        :maxlength="maxTitleLength"
        :disabled="isOccupied"
      />
      <textarea
        v-model="newContent"
        rows="4"
        class="edit-textarea"
        id="textInput"
        placeholder="Enter content here"
        @input="handleTextareaInput"
        :disabled="isOccupied"
      ></textarea>
      <div class="edit-actions">
        <button class="delete-btn-modal" @click.stop="deleteNote">
          <i class="fa-solid fa-trash-can"></i>
        </button>
        <button
          :disabled="isOccupied"
          @click.stop="cancelEdit"
          class="cancel-btn"
        >
          Cancel
        </button>
        <button :disabled="isOccupied" @click.stop="saveEdit" class="save-btn">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    utente: {
      type: String,
      required: true,
    },
    timestamp: {
      type: [String, Number],
      required: true,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
    notesPerLine: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      newTitle: this.title,
      newContent: this.content,
      formattedTimestamp: "",
      showEditIcon: false,
      maxTitleLength: 25, // Example max length for title input
      maxCharsPerLine: 32, // Default char limit per line
    };
  },
  computed: {
    truncatedContent() {
      if (this.content.length <= this.maxCharsPerLine) {
        return this.content;
      } else {
        return this.content.substring(0, this.maxCharsPerLine);
      }
    },
  },
  watch: {
    title(newVal) {
      this.newTitle = newVal;
    },
    content(newVal) {
      this.newContent = newVal;
    },
    timestamp(newVal) {
      this.formattedTimestamp = this.formatTimestamp(newVal);
    },
    isEditing() {
      this.isEditing === this.isEditing;
    },
  },

  mounted() {
    this.formattedTimestamp = this.formatTimestamp(this.timestamp);
  },

  methods: {
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
    truncateContent(content, charsPerLine) {
      if (content.length > charsPerLine) {
        return content.substring(0, charsPerLine) + "..."; // Truncate content if needed
      } else {
        return content;
      }
    },
    getCharLimit() {
      if (this.notesPerLine === 5) {
        return 32; // Max 32 characters per line if notesPerLine is 5
      } else {
        return 120; // Max 120 characters per line otherwise
      }
    },
    handleTextareaInput() {
      var box = document.getElementById("textInput");
      const charlimit = this.getCharLimit(); // Get char limit based on number of notes per line
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
    cancelEdit() {
      this.newTitle = this.title;
      this.newContent = this.content;
      this.$emit("update-is-editing", false); // Close editing mode
      this.$emit("update-is-occupied", false); // Emit false to parent
      this.showEditIcon = false;
    },
    startEdit() {
      this.newTitle = this.title;
      this.newContent = this.content;
      this.$emit("update-is-editing", true);
      this.$emit("update-is-occupied", true); // Emit true to parent
    },

    saveEdit() {
      this.isSaving = true; // Set saving flag to true
      this.$emit("update-title", this.newTitle);
      this.$emit("update-content", this.newContent);
      this.$emit("update-time", Date.now());
      this.$emit("update-is-editing", false); // Close editing mode
      this.showEditIcon = false;
    },

    deleteNote() {
      this.$emit("delete-note");
      this.$emit("update-is-occupied", false); // Emit false to parent
    },
    handleClickOutside(event) {
      // Check if click is outside the modal content
      if (!event.target.closest(".modal-content")) {
        this.saveEdit(); // Save changes before closing
        this.$emit("update-is-editing", false); // Close modal
      }
    },
  },
};
</script>

<style scoped>
@import "../assets/main.css";
/* Input and Textarea Placeholder Styling */
::placeholder {
  color: #ccc; /* Placeholder text color */
  font-style: italic; /* Placeholder font style */
  font-weight: 300; /* Placeholder font weight */
  font-size: 14px; /* Placeholder font size */
  opacity: 1; /* Ensures that the opacity is fully opaque */
}

:-ms-input-placeholder {
  /* For Internet Explorer 10-11 */
  color: #ccc;
  font-style: italic;
  font-weight: 300;
  font-size: 14px;
}

::-ms-input-placeholder {
  /* For Microsoft Edge */
  color: #ccc;
  font-style: italic;
  font-weight: 300;
  font-size: 14px;
}

/* Specific input and textarea placeholders for scoped styling */
.edit-title::placeholder {
  color: #ccc; /* Custom color for title input placeholder */
  font-style: italic;
  font-weight: 400;
  font-size: 16px;
}

.edit-textarea::placeholder {
  color: #ccc; /* Custom color for content textarea placeholder */
  font-style: italic;
  font-weight: 300;
  font-size: 14px;
}

.modal {
  position: fixed;
  background-color: #00000075;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999; /* Modal sopra tutto il resto */
}

.modal-content {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  border: 1px solid #d1d1d1;
  border-radius: 15px;
  padding: 20px;
  width: 80%;
  max-width: 600px;
  position: relative;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-20px);
}

.note {
  position: relative; /* Aggiungiamo posizione relativa per gestire posizione del modal */
  z-index: 1; /* Impostiamo z-index per assicurare che le note siano sopra il modal */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  position: relative;
  transition: box-shadow 0.3s ease;
  width: 100%; /* Note takes full width of its container */
  max-width: 700px;
  display: flex;
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
  max-width: 100%; /* Ensure content wraps within the note */
}
.placeholder {
  color: #aaa; /* Placeholder color */
  font-style: italic;
}
.edit-container {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  display: flex;
  flex-direction: column;
  width: 100%;
  border: none; /* Remove border */
  outline: none; /* Remove outline */
}

.edit-title {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  padding: 10px;
  margin-bottom: 10px;
  border: none; /* Remove border */
  outline: none; /* Remove outline */
}

textarea {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  padding: 10px;
  resize: none; /* Disable textarea resizing */
  border: none; /* Remove border */
  outline: none; /* Remove outline */
}

.edit-actions {
  justify-content: flex-end;
  top: 0;
  right: 0;
  margin-top: 5px; /* Adjust as needed */
  margin-right: 10px; /* Adjust as needed */
  display: flex;
  gap: 10px; /* Space between buttons */
}

.delete-btn-modal {
  position: absolute;
  cursor: pointer;
  font-size: 94%;
  top: 10px;
  right: 10px;
  color: red;
  background-color: transparent;
  border-color: transparent;
}
.delete-btn {
  position: absolute;
  cursor: pointer;
  top: 5px;
  right: 5px;
  font-size: 70%;
  color: red;
  background-color: transparent;
  border-color: transparent;
}

.save-btn {
  font-size: 16px;
  border-radius: 5px;
  padding-left: 15px;
  padding-right: 15px;
  padding-top: 5px;
  padding-bottom: 5px;
  cursor: pointer;
  color: var(--note-text-color);
  border-color: #b9b9b900;
  background-color: #b9b9b900;
}
.save-btn:hover {
  border-color: #b9b9b92f;
  background-color: #b9b9b92f;
}
.cancel-btn {
  font-size: 16px;
  border-radius: 5px;
  padding-left: 15px;
  padding-right: 15px;
  padding-top: 5px;
  padding-bottom: 5px;
  cursor: pointer;
  color: var(--note-text-color);
  border-color: #b9b9b900;
  background-color: #b9b9b900;
}
.cancel-btn:hover {
  border-color: #b9b9b92f;
  background-color: #b9b9b92f;
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
  font-size: 8px; /* Adjust the font size as needed */
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