<template>
    <div class="account-management">
        <div class="account-content">
        <h2>Manage Account</h2>
        <button @click="$emit('close')" class="clear-button">
        <img src="../assets/X_icon.svg" alt="Clear" />
      </button>
        <h1>{{ utente }}</h1>
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
          utente: " "
        }
      };
    },
  
    methods: {
      updateAccount() {
        // Handle the account update logic here
        console.log('Account updated:', this.account);
      },
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
  justify-content: center;
  align-items: center;
  z-index: 999; /* Ensures the modal is above everything else */
  cursor: default;
  }
  .account-content{

  background-color: var(
    --note-background-color
  ); /* Use your custom note background color */
  color: var(--note-text-color); /* Use your custom note text color */
  border: 1px solid transparent;
  padding: 20px;
  width: 80%;
  max-width: 600px;
  position: relative;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-20px);

  }
  .form-group {
    margin-bottom: 15px;
  }
  label {
    display: block;
    margin-bottom: 5px;
  }
  button {
    position: absolute; /* Posiziona in alto a destra rispetto al contenitore */
  top: 5px;
  right: 5px;
  font-size: 16px;
  padding: 10px 15px;
  cursor: pointer;
  color: var(--note-text-color);
  border: none;
  background-color: #b9b9b92f;
  border-radius: 0;
  transition: background-color 0.3s ease;
  }
  

  </style>