<template>
    <div class="account-management" @click="handleClickOutside">
        <div class="account-content">
        <h2>Manage Account</h2>
        <button @click="$emit('close')" class="clear-button">
          <img src="../assets/X_icon.svg" alt="Clear" />
        </button>
          <br>
            <div class="groups">
              <h1>Username:</h1>
            </div>
          <br>
        <div class="divider" :class="'divider-dark'"></div>
          <br>
          <div class="groups">
            <h1>Groups: </h1>
          <button @click="" class="group-btn">
            <i class="fa-solid fa-plus"></i>
        </button>
        </div>
      </div>
        <div
        v-if="!editing"
        class="group"
        @click.stop="startEdit"
        @mouseover="showEditingIcon = true"
        @mouseleave="showEditingIcon = false"
        >
            <div v-if="!editing" class="group-content">
                <h2 v-if="name">{{ groupName }}</h2>
                <h3 v-else class="placeholder">Group name</h3>
                <pre style="font-size: 8px" v-if="name">{{truncatedText(name)}}</pre>
                <h3>Members:</h3>
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
        name: {
            type: String ,
            require: true
        },
        owner: {
            type: String,
            require: true
        },
        members: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    data() {
        return {
            newName: this.name,
            newMembers: this.members.map((member) => ({...member})),
            editing: false,
            showEditingIcon: false,
            maxTitleLength: 20,
        }
    },
    watch: {
        name(newVal) {
            this.newName = newVal
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
            const editedGroup = {
                id: this.groupId,
                name: this.newName,
                members: this.newMembers
            };

            try {
                await updateGroups(this.groupId, editedGroup);
                this.editing = false;
                this.showEditingIcon = false
            }catch (error){
                console.error("Failed to save group", error)
            }
            this.$emit("save")
        },
        async deletegroup(){
            try{
                const { groups } = await loadGroups();
                const updatedGroups = groups.filter((group) => group.id !== this.groupId);
                await saveGroups(updatedGroups, false);
                this.editing = false;
                this.$emit("save")
            }catch (error){
                console.error("Failed to delete group:", error)
            }
        },
        cancelEdit() {
            this.newName = this.name;
            this.newMembers = this.members.map((member) => ({...member}))
            this.editing = false;
            this.showEditingIcon = false;
            this.$emit("save")
        },
        startEdit() {
            this.editing = true
        },
        handleClickOutside(event) {
            if(!event.target.closest(".modal-content")) {
                this.saveEdit();
                this.editing = false
            }
        },
        truncatedText(name) {
            if (name.length <= this.maxTitleLength) {
                return name;
            } else {
                return name.substring(0, this.maxTitleLength) + "...";
            }
        },
        generateUniqueId(prefix, index="") {
            return `${prefix}-${this._uid}-${index}`
        },
        addMember() {
            this.newMembers.push({ op })
        }
    }
}
</script>