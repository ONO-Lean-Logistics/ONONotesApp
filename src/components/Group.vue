<template>
    <div
      
        class="group"
        @click.stop="startEdit"
    >
        <div  class="group-content">
            <h2 v-if="title">{{ title }}</h2>
        <div >
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
        </div>
            <input
                v-model="newTitle"
                placeholder="Title"
                class="edit-title"
                id="titleInput"
                :maxlength="maxTitleLength"
            />
            <div class="edit-actions">
                <button class="delete-btn-modal" @click.stop="deletegroup">
                    <img src="../assets/delete.svg" alt="Clear" />
                </button>
                <button @click.stop="cancelEdit" class="cancel-btn"><img src="../assets/X_icon.svg" alt="Clear" /></button>
                <button @click.stop="saveEdit" class="save-btn"><img src="../assets/save.svg" alt="Clear" /></button>
            </div>
        </div>
    </div>
</template>

<script>
import { loadGroups, saveGroups, updateGroups } from '../api/apiService';

export default{
    props: {
        groupId: {
            type: [String, Number],
            require: true
        },
        title: {
            type: String,
            require: true
        },
        utente: {
            type: String,
            require: true,
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
            newMembers: this.members.map((member) => ({...member})),
            editing: false,
            showEditingIcon: false,
            maxTitleLength: 20,
        }
    },
    watch: {
        title(newVal) {
            this.newTitle = newVal
        },
        members(newVal) {
            this.newMembers = newVal.map((member) => ({...member}))
        },
    },
    mounted() {
        this.editing = false
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
                this.showEditingIcon = false
            }catch (error){
                console.error("Failed to save group", error)
            }
            this.$emit("refresh")
        },
        async deletegroup(){
            try{
                const { groups } = await loadGroups();
                const updatedGroups = groups.filter((group) => group.id !== this.groupId);
                console.log(`deleting  ${this.groupId}`)
                await saveGroups(updatedGroups);
                this.editing = false;
                this.$emit("refresh")
                
            }catch (error){
                console.error("Failed to delete group:", error)
            }
            
        },
        cancelEdit() {
            this.editing = false;
            this.showEditingIcon = false;
            this.$emit("refresh")
        },
        startEdit() {
            this.editing = true
        },
        truncatedText(title) {
            if (title.length <= this.maxTitleLength) {
                return title;
            } else {
                return title.substring(0, this.maxTitleLength) + "...";
            }
        },
        addMember() {
            this.newMembers.push({ op })
        }
    }
}
</script>