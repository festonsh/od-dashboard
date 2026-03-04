export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: true
  },
  app: {
    head: {
      title: 'Odetaa Nuxt App',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Nuxt 3 app scaffolded in Cursor.' }
      ]
    }
  }
})

