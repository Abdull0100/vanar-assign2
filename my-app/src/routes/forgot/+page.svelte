<script lang="ts">
  import type { ActionData } from './$types';
  export let form: ActionData;
</script>

<svelte:head>
  <title>Forgot Password</title>
</svelte:head>

<div class="forgot-container">
  <h1>Forgot Password</h1>
  {#if form?.success}
    <div class="success-message">
      If that email is registered, a reset link has been sent.
    </div>
  {:else}
    <form method="POST">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required autocomplete="email" />
      </div>
      <button type="submit">Send Reset Link</button>
    </form>
  {/if}
</div>

<style>
  .forgot-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
  }
  h1 { margin-bottom: 2rem; }
  .form-group { margin-bottom: 1rem; text-align: left; }
  label { display: block; margin-bottom: 0.5rem; }
  input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
  button { width: 100%; padding: 0.75rem; background-color: #007bff; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; margin-top: 1rem; }
  button:hover { background-color: #0056b3; }
  .success-message { color: #155724; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 1rem; margin-top: 1rem; }
</style>
