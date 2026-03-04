<template>
  <main class="page">
    <section class="hero">
      <h1>Welcome to your Nuxt 3 app 🎉</h1>
      <p>This project was scaffolded in the `odetaa` folder.</p>
      <div class="actions">
        <NuxtLink to="https://nuxt.com/docs" target="_blank">
          Nuxt 3 documentation
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top left, #1e293b, #020617 55%);
  color: #e5e7eb;
  padding: 2rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.hero {
  max-width: 640px;
  text-align: center;
}

h1 {
  font-size: clamp(2.5rem, 4vw, 3rem);
  font-weight: 700;
  margin-bottom: 1rem;
}

p {
  font-size: 1.05rem;
  color: #9ca3af;
  margin-bottom: 1.5rem;
}

.actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  background: linear-gradient(to right, #22c55e, #0ea5e9);
  color: #020617;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
  box-shadow: 0 10px 30px rgba(15, 118, 110, 0.6);
}

.actions a:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow: 0 15px 40px rgba(15, 118, 110, 0.75);
}
</style>

