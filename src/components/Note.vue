
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
      <h2 v-if="title" class="note-title">{{ title }}</h2>
      <!-- Display truncated content or placeholder if empty -->
      <h3 v-else class="placeholder">Title</h3>
      <pre style="font-size: 16px" v-if="content">{{
        truncateContent(content)
      }}</pre>
      <pre v-else class="placeholder">Write a note</pre>
      <div class="utente">{{ utente }}</div>
      <div class="timestamp">{{ formattedTimestamp }}</div>
      <div class="type">{{ type }}</div>
      <div class="group">{{ groupName }}</div>
    </div>
    
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
    groupName: {
      type: String,
      required: true
    },
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
      default: '',
      required: true,
      default: ''
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
        return ["classic", "list"].includes(value);
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
    content(newVal) {
      this.newContent = newVal;
    },
    // Watch for changes in title, content, and timestamp
    title(newVal) {
      this.newTitle = newVal;
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
    //disugfeiuiewufdfwgigkiy
    cancelEdit() {
      this.newTitle = this.title;
      this.isEditing = false;
      this.showEditIcon = false;
      this.$emit("save");
    },

    // Delete the note
    async deleteNote() {
      try {
        // Load all notes
        const { notes } = await loadNotes();
        
        // Filter out the deleted note
        const updatedNotes = notes.filter((note) => note.id !== this.noteId);
        
        // Save updated notes
        await saveNotes(updatedNotes, false);
        
        // Check if there are no notes left
        if (updatedNotes.length === 0) {
          // Refresh the page if no notes are left
          window.location.reload();
        } else {
          this.isEditing = false;
          this.$emit("save");
        }
      } catch (error) {
        console.error("Failed to delete note:", error);
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
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    },

    // Handle click outside the modal to save edits
    handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        this.saveEdit();
        this.isEditing = false;
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
      }
      this.$emit("save");
    },
    
    startEdit() {
      this.isEditing = true;
    },
    
    // Truncate content to fit within specified character limit per line
    truncateContent(content) {
      if (content.length > 26) {
        return content.substring(0, 26) + "...";
      } else {
        return content;
      }
    },
  },
};
</script>

<style scoped>
@import "../assets/main.css";

/* Placeholder Styling */
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

/* Modal Overlay */
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
  z-index: 999;
  cursor: default;
}

/* Modal Content */
.modal-content {
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

/* Note Container */
.note {
  background-color: var(--note-background-color);
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* To space items within the note */
  padding: 20px;
  border: 1px solid transparent;
  transition: box-shadow 0.3s ease;
  min-height: 120px;
  max-height: 120px;
  width: 100%;
  max-width: 700px;
  user-select: none;
  box-sizing: border-box; /* Ensures padding is included in the total width/height */
}

.note:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Note Content */
.note-content {
  white-space: pre-wrap;
  max-width: 100%;
  max-height: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2em;
  margin-bottom: 10px; /* Added margin for spacing */
  flex-grow: 1; /* Allow the content to take up remaining space */
}

/* Add spacing between title and content */
.note-title {
  margin-top:3px;
  margin-bottom: 3px; /* Adds 2px of space below the title */
}

/* Note Footer (Type, User, Timestamp, Delete) */
.note-footer {
  display: flex;
  justify-content: space-between; /* Aligns items to space between */
  align-items: center;
  width: 100%;
  font-size: 10px; /* Smaller font size for footer info */
  color: rgb(196, 196, 196); /* Grey color for footer */
  margin-top: 10px; /* Added margin for spacing */
}


.utente {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 1px;
  left: 5px;
  font-size: 8px; /* Adjust the font size as needed */
}

.timestamp {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 1px;
  right: 5px;
  font-size: 8px;
}

.type {
  position:absolute;
  top:1px;
  left:5px;
  font-size: 10px; /* Adjust the font size */
  color: rgb(196, 196, 196);
}
/* Delete Button ciaoo+ */
.delete-btn {
  right:5px;
  top:5px;
  position:absolute;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 0;
  flex-basis: 20%; /* Ensures consistent spacing */
  text-align: right; /* Align text to the right */
}

/* Edit Title */
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

/* Edit Textarea */
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

/* Edit Actions */
.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.edit-actions button {
  margin-left: 10px;
}

/* Save Button */
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

/* Delete Button for Modal */
.delete-btn-modal {
  position: absolute;
  bottom: 5px;
  right: 80px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 0;
}

/* Cancel Button */
.cancel-btn {
  position: absolute;
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


@media (max-width: 600px) {
  @import "../assets/main.css";

/* Placeholder Styling */
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

/* Modal Overlay */
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
  z-index: 999;
  cursor: default;
  overflow-y: auto; /* Permette lo scroll su schermi piccoli */
}

/* Modal Content */
.modal-content {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  border: 1px solid transparent;
  padding: 20px;
  width: 80%;
  max-width: 600px;
  position: relative;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-20px);
  border-radius: 8px; /* Angoli arrotondati per un design moderno */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Aggiunge un'ombra */
}

/* Note Container */
.note {
  background-color: var(--note-background-color);
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Spazio tra gli elementi */
  padding: 20px;
  border: 1px solid transparent;
  transition: box-shadow 0.3s ease;
  min-height: 120px;
  max-height: 120px;
  width: 100%;
  max-width: 700px;
  user-select: none;
  box-sizing: border-box; /* Padding incluso nella larghezza/altezza totale */
  border-radius: 0px; /* Rimuove arrotondamento angoli */
  position: relative; /* Necessario per il posizionamento assoluto degli elementi nel footer */
}
.type {
  color: #c4c4c4;
  position: absolute;
  top: 1px; /* A 1px dal bordo superiore della nota */
  left: 5px;
  font-size: 8px;
}

/* Utente */
.utente {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 1px; /* A 1px dal bordo inferiore della nota */
  left: 5px;
  font-size: 5px;
}

/* Timestamp */
.timestamp {
  color: rgb(196, 196, 196);
  position: absolute;
  bottom: 1px; /* A 1px dal bordo inferiore della nota */
  right: 5px;
  font-size: 5px;
}

.note:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Note Content */
.note-content {
  white-space: pre-wrap;
  max-width: 100%;
  max-height: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2em;
  flex-grow: 1; /* Riempie lo spazio rimanente */
}

/* Spaziatura tra titolo e contenuto */
.note-title {
  margin-top: 3px;
  margin-bottom: 3px; /* Spaziatura sotto il titolo */
  font-size: 16px; /* Dimensione font maggiore per leggibilità */
  font-weight: bold; /* Grassetto per differenziare il titolo */
}

/* Note Footer (Tipo, Utente, Timestamp, Elimina) */
.note-footer {
  display: flex;
  justify-content: space-between; /* Spazio tra gli elementi */
  align-items: center;
  width: 100%;
  color: rgb(196, 196, 196); /* Colore grigio per il footer */
  position: absolute;
}
/* Pulsante Elimina */
.delete-btn {
  right: 5px;
  top: 5px;
  position: absolute;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 4px; /* Arrotondati per un tocco migliore */
  flex-basis: 20%; /* Spaziatura coerente */
  text-align: right; /* Testo allineato a destra */
  transition: background-color 0.3s ease, color 0.3s ease; /* Transizioni */
}

.delete-btn:hover {
  background-color: rgba(255, 0, 0, 0.1); /* Indica azione distruttiva */
  color: red; /* Evidenzia il pulsante Elimina */
}

/* Titolo Modifica */
.edit-title {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 0px; /* Arrotondati per l'input */
  outline: none;
}

/* Area di testo Modifica */
.edit-textarea {
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  padding: 10px;
  resize: none;
  border-radius: 0px;
  outline: none;
}

/* Azioni Modifica */
.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.edit-actions button {
  margin-left: 10px;
  padding: 8px 12px; /* Aumenta l'area cliccabile */
  font-size: 14px;
  cursor: pointer;
  border: none;
  background-color: var(--note-background-color);
  color: var(--note-text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
  border-radius: 4px;
}

.edit-actions button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Pulsante Salva */
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
  border-radius: 4px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.save-btn:hover {
  background-color: rgba(0, 255, 0, 0.1); /* Indica l'azione di salvataggio */
  color: green;
}

/* Pulsante Elimina per Modal */
.delete-btn-modal {
  position: absolute;
  bottom: 5px;
  right: 80px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 4px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.delete-btn-modal:hover {
  background-color: rgba(255, 0, 0, 0.1);
  color: red;
}

/* Pulsante Annulla */
.cancel-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: var(--note-background-color);
  border-radius: 4px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 0, 0.1); /* Colore indicativo di annullamento */
  color: orange;
}

/* Responsiveness per dispositivi touch */
@media (max-width: 768px) {
  .modal-content,
  .note {
    width: 90%; /* Più spazio su schermi piccoli */
    max-width: none;
    border-radius:0px; /* Rimuove limite di larghezza su dispositivi piccoli */
  }

  .note {
    min-height: 100px; /* Riduce altezza minima su dispositivi piccoli */
    padding: 15px; /* Riduce padding per spazio compatto */
  }

  .note-title {
    font-size: 14px; /* Riduce dimensione font per dispositivi piccoli */
  }

  .delete-btn,
  .save-btn,
  .delete-btn-modal,
  .cancel-btn {
    font-size: 14px; /* Riduce dimensione font pulsanti per dispositivi piccoli */
    padding: 8px 12px; /* Riduce padding per spazio compatto */
  }

  .edit-title,
  .edit-textarea {
    padding: 8px; /* Riduce padding input per spazio compatto */
    font-size: 16px; /* Dimensione font maggiore per leggibilità su dispositivi touch */
  }

  .edit-actions button {
    font-size: 12px; /* Riduce dimensione font per pulsanti azioni */
  }
}

/* Limitazione visibilità delle note */
ul {
  max-height: calc(2 * 120px + 10px); /* Altezza massima per visualizzare solo 2 note alla volta */
  overflow: hidden; /* Nasconde le note extra */
}
}
</style>
