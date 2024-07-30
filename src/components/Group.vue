<template>
    <div class="group">
        <div class="group-content">
            <div>
                <input
                v-model="newTitle"
                placeholder="title"
                class="edit-title"
                id="titleInput"
                :maxlength="maxTitleLength"
            />
            <pre style="font-size: 16px" v-if="content">{{
                truncateContent(content)
            }}</pre>
                <div v-if="editing">
                    <ul>
                        <!-- List items for editing -->
                        <li v-for="(member, idx) in newMembers" :key="idx">
                        <div
                            @mouseover="hoverIndex = idx"
                            @mouseleave="hoverIndex = null"
                            class="item-container"
                        >
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
                
                <div class="edit-actions">
                    <button class="delete-btn-modal" @click.stop="deletegroup()">
                        <img src="../assets/delete.svg" alt="Clear" />
                    </button>
                    <button @click.stop="cancelEdit()" class="cancel-btn">
                        <img src="../assets/X_icon.svg" alt="Clear" />
                    </button>
                    <button @click.stop="saveEdit()" class="save-btn">
                        <img src="../assets/save.svg" alt="Clear" />
                    </button>
                </div>
            </div>
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
        }
    },
    data() {
        return {
            newTitle: this.title,
            newMembers: this.members.map((member) => ({ ...member })),
            editing: false,
            showEditingIcon: false,
            maxTitleLength: 20,
            hoverIndex: null, // Added hoverIndex for managing hover state
            content: ""
        };
    },
    watch: {
        title(newVal) {
            this.newTitle = newVal;
        },
        members(newVal) {
            this.newMembers = newVal.map((member) => ({ ...member }));
        },
    },
    mounted() {
        this.editing = false;
    },
    methods: {
        async saveEdit() {
            const filteredMembers = this.newMembers.filter((member) => member.text.trim() !== "");
            const editedGroup = {
                id: this.groupId,
                title: this.newTitle,
                members: filteredMembers
            };

            try {
                await updateGroups(this.groupId, editedGroup);
                this.editing = false;
                this.showEditingIcon = false;
                this.$emit("refresh");
            } catch (error) {
                console.error("Failed to save group", error);
            }
        },
        async deletegroup() {
            try {
                const { groups } = await loadGroups();
                console.log('Loaded groups:', groups);
                const updatedGroups = groups.filter((group) => group.id !== this.groupId);
                console.log('Groups after deletion:', updatedGroups);
                await saveGroups(updatedGroups);
                this.editing = false;
                this.$emit("refresh");
            } catch (error) {
                console.error("Failed to delete group:", error);
            }
        },
        cancelEdit() {
            this.newTitle = this.title; // Fixed to update newTitle instead of newgroupId
            this.newMembers = this.members.map((member) => ({ ...member }));
            this.editing = false;
            this.showEditingIcon = false;
            this.$emit("refresh");
        },
        startEdit() {
            this.editing = true;
        },
        truncatedText(groupId) {
            if (groupId.length <= this.maxTitleLength) {
                return groupId;
            } else {
                return groupId.substring(0, this.maxTitleLength) + "...";
            }
        },
        addMember() {
            this.newMembers.push({ text: '' }); // Initialized new member with text property
        },
        removeItem(idx) { // Added removeItem method
            this.newMembers.splice(idx, 1);
        },
        truncateContent(content) {
        if (content.length > 26) {
            return content.substring(0, 26) + "...";
        } else {
            return content;
      }
    }
}
}
</script>
<style>
.edit-title{
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
.group-content{
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
.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
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
</style>