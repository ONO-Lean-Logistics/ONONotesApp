<template>
    <div class="account-management" @click="handleClickOutside">
      <div class="account-content">
        <h2>Manage Account</h2>
        <button @click="$emit('close')" class="clear-button">
          <img src="../assets/X_icon.svg" alt="Clear" />
        </button>
          <br>
        <h1>Username:</h1>
          <br>
        <div class="divider" :class="'divider-dark'"></div>
          <br>
          <div class="groups">
          <button @click="createGroup" class="group-btn">
            <i class="fa-solid fa-plus"></i>
        </button><h1>Groups: </h1>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {  
    data() {
      return {
        account: {
          username: '',
          email: '',
          password: '',
          utente: " ",
          text: "Groups",
          group: false
        }
      };
    },
    
    methods: {
      updateAccount() {
        // Handle the account update logic here
        console.log('Account updated:', this.account);
      },

      // Handle click outside modal
    handleClickOutside(event) {
      if (!event.target.closest(".account-content")) {
        this.$emit("close")
      }
    },

    // Switch thru groups anda account
    switchToGroups(){
      this.group.value = !this.group.value
    }
    }
  };
  </script>
  
  <style scoped>
  .account-management {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.5);
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: absolute;
    justify-content: center;
    align-items: center;
    z-index: 999; /* Ensures the modal is above everything else */
    cursor: default;
  }
  .account-content{

    background-color: var(--note-background-color); /* Use your custom note background color */
    color: var(--note-text-color); /* Use your custom note text color */
    border: 1px solid transparent;
    padding: 20px;
    width: 80%;
    max-width: 600px;
    position: relative;
    transition: opacity 0.3s ease, transform 0.3s ease;
    transform: translateY(-20px);

  }
  .add-divider {
  border-left: 1px solid var(--add-divider-color);
  height: 120%;
  margin: 0 5px;
}
  .form-group {
    margin-bottom: 15px;
  }
  label {
    display: block;
    margin-bottom: 5px;
  }

  .clear-button {
    position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
    top: 5px;
    right: 5px;
    font-size: 8px;
    padding: 6px 12px;
    cursor: pointer;
    color: var(--note-text-color);
    border: none;
    background-color: #b9b9b92f;
    border-radius: 0;
  }
  
  .group-btn{
    color: #4caf50;
    background-color: var(--note-background-color);
    border: none;
    cursor: pointer;
    font-size: 12px;
    padding: 10px;
    margin-right: 10px;
  }

  .groups{
    display: flex;
    align-items: center;
  }

  h1{
    font-size: 16px;
  }
  </style>