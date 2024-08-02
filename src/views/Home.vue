<template>
  <div class="home">
    <div class="header">
      <h1 style="cursor: pointer" :class="'title-dark'" @click="refreshQuery">Memo</h1>
      <div class="search-container">
        <i class="fas fa-search search-icon" @click="startSearch"></i>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Cerca titolo, utente..."
          class="search-input"
          id="searchInput"
          @input="handleSearchInput"
        />
      </div>
      <button @click="clearSearch" class="clear-button">
        <img src="../assets/X_icon.svg" alt="Clear" />
      </button>
      <AccountManagement :utente="utente" @getSelectedGroup="getSelectedGroup"/>
    </div>

    <div class="divider" :class="'divider-dark'"></div>

      <div class=notes-control>
      <button class="add-note" @click="addNote('list')">
        <i class="fas fa-plus"></i>
        Lista
      </button>
      <button class="add-note" @click="addNote('classic')">
        <i class="fas fa-plus"></i>
        Nota
      </button>
      <div class="notes-control"></div>
      <div class="controls"></div>
      <div class="group-control"></div>
      <SortDropdown class="sort-dropdown" @select-sort-type="updateSortType" @select-sort-order="updateSortOrder" />
    </div>

    <div>
      <!-- Draggable component for notes -->
      <draggable
        :value="filteredNotes"
        :class="'notes-grid'"
        groupId="notes"
        :item-key="note => note.id"
        @end="handleDragEnd"
        v-bind="$attrs"
        v-on="$listeners"
        handle=".note-container"
        @start="handleDragStart"
      >
        <div
          v-for="(note, index) in filteredNotes"
          :key="note.id"
          :class="['note-container', { dragging: noteDragging === note.id }]"
          :draggable="true"
          @dragstart="noteDragging = note.id"
          @dragend="noteDragging = null"
        >
          <template v-if="note">
            <Note
              v-if="note.type === 'classic'"
              :title="note.title || ''"
              :content="note.content || ''"
              :timestamp="note.timestamp || Date.now()"
              :utente="note.utente || ''"
              :note-id="note.id"
              :index="index"
              :type="note.type"
              :is-editing="note.id === editingNoteId"
              :groupId="note.groupId || ''"
              @update-note="updateNote(index, $event.action, $event.data)"
              @save="refreshQuery"
            />
            <ListNote
              v-else-if="note.type === 'list'"
              :title="note.title || ''"
              :items="note.items || []"
              :timestamp="note.timestamp || Date.now()"
              :utente="note.utente || ''"
              :note-id="note.id"
              :type="note.type"
              :is-editing="note.id === editingNoteId"
              :groupId="note.groupId || ''"
              @update-note="updateNote(index, $event.action, $event.data)"
              @save="refreshQuery"
              @close-modal="editingNoteId = null"
            />
          </template>
        </div>
      </draggable>
    </div>
  </div>
</template>


<script>
import AccountManagement from "../components/AccountManagement.vue";
import Note from "../components/Note.vue";
import ListNote from "../components/ListNote.vue";
import SortDropdown from "../components/SortDropdown.vue";
import draggable from "vuedraggable";
import { loadNotes, saveNotes, updateNotes } from "@/api/apiService";

export default {
  name: "Home",
  components: {
    Note,
    ListNote,
    SortDropdown,
    draggable,
    AccountManagement
  },
  data() {
    return {
      notes: [],
      nextId: 1,
      noteDragging: null,
      searchQuery: "",
      sortType: localStorage.getItem("sortType") || "Time",
      sortOrder: localStorage.getItem("sortOrder") || "Oldest",
      showAccountManagement: false,
      editingNoteId: null,
      selectedGroupId: 'Users'
    };
  },
  computed: {
    
    filteredNotes() {
      const query = this.searchQuery.toLowerCase().trim();
      return this.notes.filter((note) => {
        const titleMatch = (note.title || "").toLowerCase().includes(query);
        const utenteMatch = (note.utente || "").toLowerCase().includes(query);
        const groupMatch = this.selectedGroupId === null || note.groupId === this.selectedGroupId;
        return (titleMatch || utenteMatch) && groupMatch;
      });
    },
  },
  
  created() {
    this.refreshQuery();
  },
  methods: {
    async addNote(type) {
      let newNote;
      
      if (type === "classic") {
        newNote = {
          groupId: this.selectedGroupId,
          title: "",
          content: "",
          id: this.nextId,
          timestamp: Date.now(),
          utente: this.utente,
          type: "classic",
          isEditing: true,
        };
      } else if (type === "list") {
        newNote = {
          groupId: this.selectedGroupId,
          title: "",
          items: [],
          id: this.nextId,
          timestamp: Date.now(),
          utente: this.utente,
          type: "list",
          isEditing: true,
        };
      }

      this.nextId++;
      if (newNote) {
        this.notes.push(newNote);
        this.editingNoteId = newNote.id;
        try {
          await updateNotes(newNote.id, newNote);
        } catch (error) {
          console.error("Error saving the new note:", error);
        }
      }
    },
    async getSelectedGroup(data){
      this.selectedGroupId = data
    },
    clearSearch() {
      this.searchQuery = "";
    },
    handleDragEnd(event) {
      if (event.item && event.item.firstChild && event.item.firstChild.classList.contains("add-note")) {
        event.preventDefault();
        return;
      }
      event.item.style.opacity = "1";
      document.body.style.cursor = "default";
      event.item.style.cursor = "grab";
      this.handleNoteReorder(event);
      this.saveAllNotes();
    },
    handleDragStart(event) {
      if (event.item && event.item.firstChild && event.item.firstChild.classList.contains("add-note")) {
        event.preventDefault();
        return;
      }
      event.item.style.opacity = "0";
      event.clone.style.opacity = "1000";
      document.body.style.cursor = "grabbing";
      event.item.style.cursor = "grabbing";
    },
    handleNoteReorder(event) {
      const movedNote = this.notes.splice(event.oldIndex, 1)[0];
      this.notes.splice(event.newIndex, 0, movedNote);
    },
    handleSearchInput() {
      const inputElement = document.getElementById("searchInput");
      if (inputElement) {
        inputElement.style.width = `${Math.max(100, this.searchQuery.length * 10)}px`;
      }
    },

    async refreshQuery() {
      let operatorName = sessionStorage.getItem("operatorName") || 'Default Name';
      let operatorSurname = sessionStorage.getItem("operatorSurname") || 'Default Surname';
      this.utente = `${operatorName} ${operatorSurname}`;
      try {
        const response = await loadNotes();
        let resNotes = response.notes;

        if (resNotes && Array.isArray(resNotes) && resNotes.length > 0) {
          resNotes = resNotes.filter((note) => note && note.id !== null && note.id !== undefined);
        }
        if (resNotes && resNotes.length > 0) {
          this.notes = resNotes;
          this.nextId = Math.max(...this.notes.map((note) => note.id)) + 1;
        } else {
          this.nextId = 1;
        }

      } catch (error) {
        console.error("Error loading notes:", error);
      }
    },
    async saveAllNotes() {
      try {
        await saveNotes(this.notes);
      } catch (error) {
        console.error("Error saving notes:", error);
      }
    },
    updateNote(index, action, data) {
      const note = this.notes[index];
      if (note) {
        if (action === "update") {
          Object.assign(note, data);
        } else if (action === "delete") {
          this.notes.splice(index, 1);
        }
      }
    },
    updateSortType(type) {
      this.sortType = type;
      localStorage.setItem("sortType", type);
    },
    updateSortOrder(order) {
      this.sortOrder = order;
      localStorage.setItem("sortOrder", order);
    },
    sortNotes(notes) {
      if (this.sortType === "Time") {
        notes.sort((a, b) => (this.sortOrder === "Oldest" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp));
      }
      return notes;
    },
    startSearch() {
      // Trigger search functionality if needed
    }
  }
};
</script>




<style scoped>
@import "../assets/main.css";

.account-management {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;

}
/* App container */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;

}

.home {
  flex-grow: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: var(--background-color);
  transition: background-color 0.3s ease, color 0.3s ease;
  margin-bottom: 1.5%;
  height: 40px;
  position: relative;
  width: 100%;
}

.header h1 {
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}

.header h2 {
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}
.header button.clear-button {
  margin-left: 10px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    top: 7px
  }

.search-container {
  display: flex;
  align-items: center;
  flex-grow: 1;
  position: relative;
  min-width: none;
  margin-left: 15px;
  height: 25px;
}

.search-icon {
  cursor: pointer;
  position: absolute;
  left: 10px;
  font-size: 14px;
  color: #ffff;
}

.search-text {
  position: absolute;
  top: -8px;
  left: 15px;
  background-color: var(--background-color);
  padding: 0 5px;
  color: var(--text-color);
  font-size: 12px;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  height: 55px;
  flex-grow: 1;
  font-size: 18px;
  padding: 10px 40px 10px 40px;
  background-color: var(--search-bar-background-color);
  border: 2px solid;
  border-color: var(--note-background-color);
  border-radius: 10px;
  color: var(--text-color);
  transition: background-color 0.3s ease, border-color 0.3s ease,
  box-shadow 0.3s ease, width 0.3s ease;
  outline: none;
  caret-color: #4a7daa;
}

.search-input:focus {
  border-color: #2a577e;
  box-shadow: 0 0 5px transparent;
}

.search-input:not(:placeholder-shown) + .clear-icon {
  opacity: 1;
  right: 10px;
}

.clear-icon {
  font-size: 25px;
  position: absolute;
  right: 45px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #ffff;
  background-color: transparent;
  transition: opacity 0.3s ease, right 0.3s ease;
  opacity: 0;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  margin-left:auto;
  margin-right: 0.5%;
}

.notes-control {
  display: flex;
  align-items: right;
  background-color: #7c7c7c00;
}

.sort-menu {
  display: flex;
  align-items:horizontal;
  margin-left: auto;
  margin-top:3px;
}

.notes-grid {
  display: grid;
  gap: 20px;
  flex-grow: 1;
  overflow-y: auto;
  grid-template-columns: repeat(5, 1fr);
}

.note-container {
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

.add-note, .reset-button {
  padding: 8px 16px;
  font-size: 14px;
  background-color: #7c7c7c00;
  color: #9c9c9c;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-note:hover, .reset-button:hover{
  background-color: #72707075;
}

.note-container.dragging,
.add-note.dragging {
  opacity: 100%;
}

.dragging {
  opacity: 100%;
}

@media (max-width: 768px) {
@import "../assets/main.css";

body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  background-color: #333; /* Colore di sfondo neutro per l'interfaccia */
  margin: 0;
  padding: 0;
}

/* Container principale dell'app */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 10px; /* Ridotto per ottimizzare lo spazio */
}

/* Home */
.home {
  flex-grow: 1;
  padding: 10px; /* Ridotto per adattarsi agli schermi piccoli */
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  gap: 8px; /* Ridotto per ottimizzare lo spazio */
  background-color: var(--background-color);
  transition: background-color 0.3s ease, color 0.3s ease;
  margin-bottom: 0; /* Rimosso margine inferiore per allineare esattamente */
  height: 50px; /* Altezza dell'header */
  position: relative;
  width: 100%;
  padding: 0 10px; /* Ridotto per ottimizzare lo spazio */
  text-align: center; /* Allinea al centro */
}

/* Spaziatura per il logo e il messaggio di benvenuto */
.header h1,
.header h2 {
  cursor: pointer;
  margin: 0;
  font-size: 16px; /* Ridotto per spazi più contenuti */
}

.group-selector {
  margin-right: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
/* Barra di ricerca sotto l'header */
.search-container {
  position: relative; /* Assicurati che la posizione sia relativa per il posizionamento assoluto */
  top: 3px; /* Spostato sopra per allinearsi con la X */
  width: 100%; /* Occupa tutta la larghezza disponibile */
  margin-bottom: 8px; /* Margine inferiore per separare dalla sezione successiva */
}

/* Contenitore di ricerca */
.search-container {
  display: flex; /* Cambiato da block a flex per mantenere l'allineamento */
  align-items: center;
}

/* Modifiche per l'input di ricerca */
.search-input {
  height: 40px; /* Ridotto per dimensioni più contenute */
  font-size: 16px; /* Ridotto per dimensioni più contenute */
  padding: 8px 40px; /* Ridotto per dimensioni più contenute */
  background-color: var(--search-bar-background-color);
  border: 2px solid;
  border-color: var(--note-background-color);
  border-radius: 8px; /* Ridotto per dimensioni più contenute */
  color: var(--text-color);
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
  caret-color: #4a7daa;
  width: 100%; /* Occupa tutta la larghezza disponibile */
}

.search-input:focus {
  border-color: #2a577e;
  box-shadow: 0 0 5px transparent;
}

.search-input:not(:placeholder-shown) + .clear-icon {
  opacity: 1;
  right: 8px; /* Ridotto per dimensioni più contenute */
}

.clear-icon {
  font-size: 24px; /* Ridotto per dimensioni più contenute */
  position: absolute;
  right: 40px; /* Ridotto per dimensioni più contenute */
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #fff;
  background-color: transparent;
  transition: opacity 0.3s ease, right 0.3s ease;
  opacity: 0;
}

/* Pulsanti di gruppo */
.account-management button.group-button {
  padding: 8px 14px; /* Ridotto per dimensioni più contenute */
  font-size: 14px; /* Ridotto per dimensioni più contenute */
  background-color: #7c7c7c00;
  color: #d9dadc;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* Controlli */
.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px; /* Ridotto per ottimizzare lo spazio */
  padding: 0 8px; /* Ridotto per ottimizzare lo spazio */
}

.notes-control {
  display: flex;
  align-items: center;
  background-color: #7c7c7c00;
}

.sort-menu {
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-top: 2px; /* Ridotto per dimensioni più contenute */
}

/* Griglia delle note */
.notes-grid {
  display: grid;
  gap: 8px; /* Ridotto per dimensioni più contenute */
  flex-grow: 1;
  overflow-y: auto;
  grid-template-columns: repeat(3, 1fr); /* Sempre 3 colonne */
  grid-auto-rows: minmax(auto, auto); /* Altezza minima per le righe */
}

/* Contenitore nota */
.note-container {
  min-height: 100px; /* Ridotto per dimensioni più contenute */
  width: 100%;
  max-width: 100%;
  margin-bottom: 10px; /* Ridotto per dimensioni più contenute */
  cursor: grab;
  display: block;
  background-color: transparent;
  color: var(--note-text-color);
  overflow: hidden;
  transition: opacity 0.8s ease;
}

/* Pulsanti aggiungi e reset */
.add-note,
.reset-button {
  padding: 8px 14px; /* Ridotto per dimensioni più contenute */
  font-size: 12px; /* Ridotto per dimensioni più contenute */
  background-color: #7c7c7c00;
  color: #9c9c9c;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-note:hover,
.reset-button:hover {
  background-color: #72707075;
}

/* Note in fase di trascinamento */
.note-container.dragging,
.add-note.dragging {
  opacity: 100%;
}

.dragging {
  opacity: 100%;
}

}
</style>