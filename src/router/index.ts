import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 定义路由
const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/dashboard',
        meta: { title: '首页' }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表板', icon: 'dashboard' }
    },
    {
        path: '/job-flow',
        name: 'JobFlow',
        component: () => import('../views/JobFlow.vue'),
        meta: { title: '任务流管理', icon: 'jobFlow' }
    },
    {
        path: '/restic',
        name: 'Restic',
        component: () => import('../views/Restic.vue'),
        meta: { title: '备份管理', icon: 'restic' }
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// 全局前置守卫（这里简单处理，不需要登录验证）
// router.beforeEach((to, from, next) => {
//     // 可以在这里添加权限控制逻辑
//     next()
// })

export default router