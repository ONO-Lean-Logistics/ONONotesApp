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
      <div class="account-management">
        <button @click="toggleAccountManagement" class="group-button">
          <h2>Benvenuto <br />{{ this.utente }}</h2>
        </button>
        <!--<Group 
        v-show="showAccountManagement" 
        @close="showAccountManagement = false, refreshQuery()" 
        :group-id="group.id"
        :name="group.name"
        :owner="group.owner"
        :members="group.members"/>-->
      </div>
    </div>
    <div class="divider" :class="'divider-dark'"></div>

    <div class="controls">
      <button class="add-note" @click="addNote('list')">
        <i class="fas fa-plus"></i>
        Lista
      </button>
      <button class="add-note" @click="addNote('classic')">
        <i class="fas fa-plus"></i>
        Nota
      </button>
      <div class="notes-control"></div>

      <SortDropdown
        class="sort-dropdown"
        @select-sort-type="updateSortType"
        @select-sort-order="updateSortOrder"
      />
    </div>

    <div>
      <!-- Draggable component for notes -->
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
          :class="['note-container', { dragging: noteDragging === note.id }]"
          :draggable="true"
          @dragstart="noteDragging = note.id"
          @dragend="noteDragging = null"
        >
          <template v-if="note">
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
        </div>
      </draggable>
    </div>
  </div>
</template>


<script>
import Group from "../components/Group.vue";
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
    Group
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
      showAccountManagement: false
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
    // Simply sort the filtered notes without adding an empty container
    return this.sortNotes(this.filteredNotes);
  },
},

  created(){
    this.refreshQuery();
  },

  methods: {

    // Add new note function
    async addNote(type) {
      let addingNoteType = type;
      let newNote;

      // Differentiating the type of notes
      if (addingNoteType === "classic") {
        newNote = {
          title: "",
          content: "",
          id: this.nextId,
          timestamp: Date.now(),
          utente: this.utente,

          type: "classic", // Marking it as a classic note
        };
      } else if (addingNoteType === "list") {
        newNote = {
          title: "",
          items: [],
          id: this.nextId,
          timestamp: Date.now(),
          utente: this.utente,
          type: "list", // Marking it as a list note
        };
      }

      this.nextId++; // Increment the next ID
      if(newNote != null){
        console.log(newNote);
        this.notes.push(newNote); // Add the note to the list
      try {
        // Save the new note using updateNotes function
        await updateNotes(newNote.id, newNote);
      } catch (error) {
        console.error("Error saving the new note:", error);
      }
      }
      
    },

    // Clear search query
    clearSearch() {
        this.searchQuery = '';
        this.$emit('input', this.searchQuery);
      },
    
    // Drag end function
    handleDragEnd(event) {
      // Ignore drag if the item is an add button
      if (
        event.item &&
        event.item.firstChild &&
        event.item.firstChild.classList.contains("add-note")
      ) {
        event.preventDefault();
        return;
      }
      event.item.style.opacity = "1";
      document.body.style.cursor = "default";
      event.item.style.cursor = "grab";
      this.handleNoteReorder(event);
      this.saveAllNotes();
    },

    // Drag start function
    handleDragStart(event) {
      // Ignore drag if the item is an add button
      if (
        event.item &&
        event.item.firstChild &&
        event.item.firstChild.classList.contains("add-note")
      ) {
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

    // Handle input in the search bar
    handleSearchInput() {
      // Adjust the search input width based on content
      const inputElement = document.getElementById("searchInput");
      if (inputElement) {
        inputElement.style.width = `${Math.max(
          100,
          this.searchQuery.length * 10
        )}px`;
      }
    },
    async refreshQuery() {
          
      // Retrieve user information from session storage
      let operatorName = sessionStorage.getItem("operatorName");
      let operatorSurname = sessionStorage.getItem("operatorSurname");
      this.utente = `${operatorName} ${operatorSurname}`;
      try {
        const response = await loadNotes(); 
        let resNotes = response.notes;

        if (resNotes && Array.isArray(resNotes) && resNotes.length > 0) {
          resNotes = resNotes.filter(note => note && note.id !== null && note.id !== undefined);
        }
        if(resNotes != null &&  resNotes.length>0 ) {
          console.log(`After filtering: ${response.notes}`)
          this.notes = resNotes; 
          this.nextId =  Math.max(...this.notes.map((note) => note.id)) + 1;
        }else{
          this.nextId = 1; 
        }
      } catch (error) {
        console.error("Error loading notes:", error);
      }
    },

    // Save all notes function
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

    // Perform search based on query
    search() {
      const query = this.searchQuery.toLowerCase().trim();
      if (!query) return this.notes;

      return this.notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const utenteMatch = note.utente.toLowerCase().includes(query);
        return titleMatch || utenteMatch;
      });
    },
    sortNotes(notes) {
      
  if (this.sortType === "Time") {
    if (this.sortOrder === "Recent") {
      return notes.sort((a, b) => b.timestamp - a.timestamp);
    } else if (this.sortOrder === "Oldest") {
      return notes.sort((a, b) => a.timestamp - b.timestamp);
    }
  } else if (this.sortType === "Length") {
    return notes.sort((a, b) => {
      const aLength = a.type === "classic" ? a.content.length : (a.items ? a.items.length : 0);
      const bLength = b.type === "classic" ? b.content.length : (b.items ? b.items.length : 0);

      
      if (this.sortOrder === "Most") {
        return bLength - aLength; 
      } else if (this.sortOrder === "Least") {
        return aLength - bLength; 
      }
       return 0; 
      });
    }
    return notes;
  },

    toggleAccountManagement(){
      this.showAccountManagement = true
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
        title: "",
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
  }
.account-management button.group-button {
  position: relative;
  padding: 8px 16px;
  font-size: 14px;
  background-color: #7c7c7c00;
  color: #D9DADC;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
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
  background-color: #2a577e;
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
  color: var(note-text-color);
  overflow: hidden;
  transition: opacity 0.8s ease;
}

.add-note {
  padding: 8px 16px;
    font-size: 14px;
    background-color: #7c7c7c00;
    color: #9c9c9c;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.add-note:hover{
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
