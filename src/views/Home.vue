<template>
  <div class="home">
    <div class="header">
      <h1 style="cursor: pointer" :class="'title-dark'" @click="refreshQuery">
        Memo
      </h1>
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
    </div>
    <div class="divider" :class="'divider-dark'"></div>

    <div class="controls">
      <div class="notes-control"></div>
      <SortDropdown class="sort-dropdown" @select-sort-type="updateSortType" @select-sort-order="updateSortOrder" />
    </div>

    <div>
      <draggable
        :value="filteredNotesWithAddButton"
        :class="'notes-grid'"
        group="notes"
        :item-key="(note) => note.id"
        @end="handleDragEnd"
        v-bind="$attrs"
        v-on="$listeners"
        handle=".note-container"
        @start="handleDragStart"
      >
        <div
          v-for="(note, index) in filteredNotesWithAddButton"
          :key="note.id"
          :class="[
            'note-container',
            note.isAddButton ? 'add-note-container' : '',
            { dragging: noteDragging === note.id },
          ]"
          :draggable="!note.isAddButton ? 'true' : 'false'"
          @dragstart="noteDragging = note.id"
          @dragend="noteDragging = null"
        >
          <template v-if="note && !note.isAddButton">
            <Note
              v-if="note.type === 'classic'"
              :title="note.title"
              :content="note.content"
              :timestamp="note.timestamp"
              :utente="note.utente"
              :note-id="note.id"
              :index="index"
              :type="note.type"
              @update-note="updateNote(index, $event.action, $event.data)"
              @save="refreshQuery()"
            />
            <ListNote
              v-else-if="note.type === 'list'"
              :title="note.title"
              :items="note.items"
              :timestamp="note.timestamp"
              :utente="note.utente"
              :note-id="note.id"
              :type="note.type"
              @update-note="updateNote(index, $event.action, $event.data)"
              @save="refreshQuery()"
            />
          </template>
          <template v-else-if="note && note.isAddButton">
            <div v-if="!isSearchActive" class="note add-note">
              <div @click="addNote('classic')" class="add-button-classic">
                <i class="fas fa-plus"></i>
                <span>Nota</span>
              </div>

              <div class="add-divider"></div>

              <div class="list add-list">
                <div @click="addNote('list')" class="add-button-list">
                  <i class="fas fa-plus"></i>
                  <span>Lista</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </draggable>
    </div>
  </div>
</template>

<script>
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
  },
  data() {
    return {
      notes: [],
      nextId: 1,
      noteDragging: null,
      searchQuery: "",
      utente: "",
      sortType: localStorage.getItem("sortType") || "Time",
      sortOrder: localStorage.getItem("sortOrder") || "Oldest",
    };
  },

  computed: {
    filteredNotes() {
      const query = this.searchQuery.toLowerCase().trim();
      if (!query) return this.notes;

      return this.notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const utenteMatch = note.utente.toLowerCase().includes(query);
        return titleMatch || utenteMatch;
      });
    },
    filteredNotesWithAddButton() {
      const notesWithAddButton = [...this.filteredNotes];
      if (!this.isSearchActive) {
        notesWithAddButton.push({ isAddButton: true }); // Add button as a separate note
      }
      return this.sortNotes(notesWithAddButton);
    },
    isSearchActive() {
      return this.searchQuery.trim() !== "";
    }
  },
  created(){
    this.refreshQuery();
  },

  methods: {
    async refreshQuery() {
      let operatorName = sessionStorage.getItem("operatorName");
      let operatorSurname = sessionStorage.getItem("operatorSurname");
      this.utente = `${operatorName} ${operatorSurname}`;
      try {
        const response = await loadNotes(); 
        let resNotes = response.notes;

        if (resNotes && Array.isArray(resNotes) && resNotes.length > 0) {
          resNotes = resNotes.filter(note => note && note.id !== null && note.id !== undefined);
        }
        if(resNotes != null &&  resNotes.length>0) {
          this.notes = resNotes; 
          this.nextId =  Math.max(...this.notes.map((note) => note.id)) + 1;
        }else{
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
    startSearch() {
      if (this.searchQuery.trim() !== "") {
        this.search();
      }
    },
    search() {
      const query = this.searchQuery.toLowerCase().trim();
      if (!query) return this.notes;

      return this.notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const utenteMatch = note.utente.toLowerCase().includes(query);
        return titleMatch || utenteMatch;
      });
    },
    clearSearch() {
      this.searchQuery = '';
      this.$emit('input', this.searchQuery);
    },
    handleSearchInput() {
      const inputElement = document.getElementById("searchInput");
      if (inputElement) {
        inputElement.style.width = `${Math.max(
          100,
          this.searchQuery.length * 10
        )}px`;
      }
    },
    sortNotes(notes) {
      if (this.sortType === "Time") {
        if (this.sortOrder === "Recent") {
          return notes.sort((a, b) => b.timestamp - a.timestamp);
        } else if (this.sortOrder === "Oldest") {
          return notes.sort((a, b) => a.timestamp - b.timestamp);
        }
      } else if (this.sortType === "Length") {
        if (this.sortOrder === "Most") {
          return notes.sort((a, b) => {
            if (a.type === "classic" && b.type === "classic") {
              return b.content.length - a.content.length;
            } else if (a.type === "list" && b.type === "list") {
              return b.items.length - a.items.length;
            }
            return 0;
          });
        } else if (this.sortOrder === "Least") {
          return notes.sort((a, b) => {
            if (a.type === "classic" && b.type === "classic") {
              return a.content.length - b.content.length;
            } else if (a.type === "list" && b.type === "list") {
              return a.items.length - b.items.length;
            }
            return 0;
          });
        }
      }
      return notes;
    },
    handleDragStart(event) {
      event.target.classList.add("dragging");
    },
    handleDragEnd(event) {
      event.target.classList.remove("dragging");
      this.saveAllNotes();
    },
    updateNote(index, action, data) {
      if (action === "delete") {
        this.notes.splice(index, 1);
      } else if (action === "update") {
        this.$set(this.notes, index, data);
      }
      this.saveAllNotes();
    },
    updateSortType(type) {
      this.sortType = type;
      localStorage.setItem("sortType", type);
    },
    updateSortOrder(order) {
      this.sortOrder = order;
      localStorage.setItem("sortOrder", order);
    },
    addNote(type) {
      const newNote = {
        id: this.nextId++,
        title: "Nuova Nota",
        content: "",
        timestamp: Date.now(),
        type: type,
        utente: this.utente,
      };
      this.notes.push(newNote);
      this.saveAllNotes();
    },
  },
};
</script>

<style scoped>
@import "../assets/main.css";

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

.header button.clear-button {
  margin-left: 10px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
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
  margin-right: 0.5%;
}

.notes-control {
  display: flex;
  align-items: left;
}

.sort-dropdown {
  margin-left: auto;
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
  color: var(--note-text-color);
  overflow: hidden;
  transition: opacity 0.8s ease;
}

.add-note {
  width: 100%;
  max-width: 300px; 
  height: 120px;
  background-color: #f0f0f0;
  border: #ccc;
  color: #aaa;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  cursor: pointer;
  padding: 10px;
  flex-direction: row-reverse;
  transition: background-color 0.8s ease, opacity 0.8s ease; 
}

.add-button-classic,
.add-button-list {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.8s ease;
  padding: 10px;
  margin: 0 5px;
}

.add-button-classic:hover,
.add-button-list:hover {
  background-color: #e0e0e0;
}

.add-divider {
  border-left: 1px solid var(--add-divider-color);
  height: 120%;
  margin: 0 5px;
}

.note-container.dragging,
.add-note.dragging {
  opacity: 100%; 
}

.dragging {
  opacity: 100%;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  .notes-grid {
    grid-template-columns: repeat(3, 1fr); 
  }
  .search-container {
    margin-left: 0;
  }

  .search-input {
    margin-left: 0;
  }

}
</style>
