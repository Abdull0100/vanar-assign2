<script lang="ts">
  import type { PageData, ActionData } from './$types';
  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Reset Password</title>
</svelte:head>

<div class="reset-container">
  <h1>Reset Password</h1>
  {#if data.error}
    <div class="error-message">{data.error}</div>
  {:else}
    <form method="POST">
      <div class="form-group">
        <label for="password">New Password:</label>
        <input type="password" id="password" name="password" required minlength="8" />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password:</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8" />
      </div>
      {#if form?.error}
        <div class="error-message">{form.error}</div>
      {/if}
      <button type="submit">Reset Password</button>
    </form>
  {/if}
</div>

<style>
  .reset-container {
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
  button { width: 100%; padding: 0.75rem; background-color: #28a745; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; margin-top: 1rem; }
  button:hover { background-color: #218838; }
  .error-message { color: #dc3545; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 0.75rem; margin-bottom: 1rem; }
</style>
