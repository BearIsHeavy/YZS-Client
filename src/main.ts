import { createApp } from 'vue'
import './style.css' // Imports Tailwind CSS
import App from './App.vue'

// Import Element Plus and its CSS
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

// Use Element Plus in your Vue app
app.use(ElementPlus)

app.mount('#app')
