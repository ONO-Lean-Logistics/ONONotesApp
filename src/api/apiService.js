import axios from "axios";

const appCode = "note_test"; // Codice dell'applicazione ONO
const appDataName = "test"; // Nome unico per l'appData che conterrà tutte le note
const appGroupName = "group";
sessionStorage.setItem("operatorName", "Mamma");
sessionStorage.setItem("operatorSurname", "Mia");

const apiClient = axios.create({
  baseURL: "http://139.59.150.152:7576/grpc/",
  headers: {
    "Content-Type": "application/json",
    "Grpc-Metadata-Content-Type": "application/grpc",
    Vary: "Origin",
    // Authorization: `Bearer ${yourJWTToken}`, // Include your actual JWT token here if required
  },
});

// Load notes from the server
export async function loadNotes() {
  try {
    console.log(`Before filtering`)
    const notesResponse = await getAllNotes(); // Fetch notes from API

    const responseArray = JSON.parse(notesResponse.data);
    if (
      responseArray &&
      Array.isArray(responseArray) &&
      responseArray.length === 2
    ) {
      const notes = responseArray[0]; // Array of notes
      const occupancyStatus = responseArray[1][0]?.isOccupied || false; // Extract isOccupied value, default to false if not present
      console.log(`Before filtering 2`)
      return {
        notes,
        occupancyStatus,
      };
    } else {
      console.error("Invalid server response format");
      return null;
    }
  } catch (error) {
    console.error("Error loading notes:", error);
    return null;
  }
}
// Save notes to the server
export async function saveNotes(notes, isOccupiedFromServer) {
  console.log(`before try/catch save`)
  try {
    // Prepara i dati delle note
    const validNotes = notes.filter(note => note !== null && note !== undefined);
    const allNotes = validNotes.map((note) => {
      if (note.type === "classic") {
        console.log(`Save note`)
        return {
          id: note.id,
          title: note.title,
          content: note.content, // Contenuto della nota classica
          timestamp: note.timestamp,
          utente: note.utente,
          isEditing: note.isEditing,
          type: note.type,
        };
      } else if (note.type === "list") {
        console.log(`save list`)
        return {
          id: note.id,
          title: note.title,
          items: note.items, // Array di elementi della lista
          timestamp: note.timestamp,
          utente: note.utente,
          isEditing: note.isEditing,
          type: note.type,
        };
      }
      
    });
    // Prepara i dati da salvare
    const dataToSave = {
      appCode: appCode,
      dataName: appDataName,
      dataValue: JSON.stringify([
        allNotes,
        [{ isOccupied: isOccupiedFromServer }],
      ]), // Converti le note in stringa JSON
    };
    // Effettua la richiesta al server
    await makeONORequest("SetONOAppData", dataToSave);
  } catch (error) {
    console.error("Errore durante il salvataggio delle note:", error);
    throw error;
  }
}
export async function updateNotes(noteId, updatedNote) {
  try {
    const { notes, occupancyStatus } = await loadNotes(); // Load current notes
    if (!notes) {
      throw new Error("Failed to load notes");
    }
    // Check if the system is occupied
    if (occupancyStatus) {
      console.warn("System is occupied, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 500)); // Sleep 500 milliseconds
      return updateNotes(noteId, updatedNote); // Retry the operation
    }
    // Update occupancy status to true before modifying
    await saveNotes(notes, true);
    // Find index of the note to update

    const validNotes = notes.filter(note => note !== null && note !== undefined);

    const noteIndex = validNotes.findIndex((note) => note.id === noteId);
    if (noteIndex === -1) {
      notes.push(updatedNote);
    }

    // Update the note
    notes[noteIndex] = { ...notes[noteIndex], ...updatedNote };

    // Save updated notes back to server with occupancy status set to false

    await saveNotes(notes, false);
  } catch (error) {
    console.error("Error updating notes:", error);
    throw error;
  }
}
// Get all notes from the server
async function getAllNotes() {
  const response = await makeONORequest("GetONOAppDataFromCode", {
    appCode: appCode,
    dataName: appDataName,
  });
  return response.data;
}

// Make a request to the ONO server
async function makeONORequest(endpoint, requestData) {
  try {
    const response = await apiClient.post(endpoint, requestData);
    return response.data;
  } catch (error) {
    console.error(`Errore durante la richiesta ${endpoint}:`, error);
    throw error;
  }
}

// Save groups to the server
export async function saveGroups(groups) {
  console.log("Before try/catch save");
  try {
    // Filter out null or undefined values
    const validGroups = groups.filter(group => group !== null && group !== undefined);

    // Prepare data to save
    const dataToSave = {
      appCode: appCode,
      dataName: appGroupName,
      dataValue: JSON.stringify({ "groups": validGroups }) // Convert groups to JSON string
    };

    // Make the request to the server
    await makeONORequest("SetONOAppData", dataToSave);
  } catch (error) {
    console.error("Error saving groups:", error);
    throw error;
  }
}

// Get all groups from the server
async function getAllGroups() {
  try {
    const response = await makeONORequest("GetONOAppDataFromCode", {
      appCode: appCode,
      dataName: appGroupName
    });

    console.log("Response from getAllGroups:", response.data);

    // Verify that response.data is in the correct format
    return response.data;
  } catch (error) {
    console.error("Error fetching all groups:", error);
    throw error;
  }
}

export async function updateGroups(groupId, updatedGroup) {
  try {
    const { groups, occupancyStatus } = await loadGroups(); // Load current groups
    if (!groups) {
      throw new Error("Failed to load groups");
    }

    // Check if the system is occupied
    if (occupancyStatus) {
      console.warn("System is occupied, retrying...");
      await new Promise(resolve => setTimeout(resolve, 500)); // Sleep 500 milliseconds
      return updateGroups(groupId, updatedGroup); // Retry the operation
    }

    // Update occupancy status to true before modifying
    await saveGroups(groups, true);

    // Find index of the group to update
    const validGroups = groups.filter(group => group !== null && group !== undefined);
    const groupIndex = validGroups.findIndex(group => group.id === groupId);

    if (groupIndex === -1) {
      // If group is not found, add it
      validGroups.push(updatedGroup);
    } else {
      // Update the group
      validGroups[groupIndex] = { ...validGroups[groupIndex], ...updatedGroup };
    }

    // Save updated groups back to server with occupancy status set to false
    await saveGroups(validGroups, false);
  } catch (error) {
    console.error("Error updating groups:", error);
    throw error;
  }
}
// Load notes from the server
export async function loadGroups() {
  try {
    console.log("Before fetching groups");
    const groupsResponse = await getAllGroups(); // Fetch groups from API

    console.log("Raw API response:", groupsResponse.data);

    let responseObject = groupsResponse.data;

    // Check if the response is a string and needs parsing
    if (typeof responseObject === 'string') {
      responseObject = JSON.parse(responseObject);
    }

    if (responseObject && typeof responseObject === 'object' && Array.isArray(responseObject.groups)) {
      const groups = responseObject.groups;

      console.log("Parsed groups:", groups);

      return {
        groups
      };
    } else {
      // Handle cases where the response is not as expected
      console.error("Invalid server response format: Expected an object with a 'groups' array.");
      console.error("Received data:", responseObject);
      return {
        groups: []
      }; // Return an empty array or handle as appropriate
    }
  } catch (error) {
    console.error("Error loading groups:", error);
    return {
      groups: []
    }; // Return an empty array or handle as appropriate
  }
}