import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
import {createPinia} from "pinia";

// 创建应用实例
const app = createApp(App)

// 使用 store
app.use(createPinia())

// 使用路由和Naive UI
app.use(router)
app.use(naive)

app.mount('#app')