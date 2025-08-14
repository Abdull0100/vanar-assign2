<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Email Verification</title>
</svelte:head>

<div class="verification-container">
  {#if data.success}
    <div class="success-message">
      <div class="icon">✅</div>
      <h1>Email Verified!</h1>
      <p>{data.message}</p>
      <a href="/" class="home-link">Go to Home</a>
    </div>
  {:else}
    <div class="error-message">
      <div class="icon">❌</div>
      <h1>Verification Failed</h1>
      <p>{data.message}</p>
      <a href="/signup" class="signup-link">Sign Up Again</a>
    </div>
  {/if}
</div>

<style>
  .verification-container {
    max-width: 500px;
    margin: 4rem auto;
    padding: 2rem;
    text-align: center;
  }

  .success-message,
  .error-message {
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .success-message {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }

  .error-message {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }

  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  h1 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  p {
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }

  .home-link,
  .signup-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .home-link:hover,
  .signup-link:hover {
    background-color: #0056b3;
  }

  .signup-link {
    background-color: #28a745;
  }

  .signup-link:hover {
    background-color: #218838;
  }
</style>
