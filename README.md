# 增量开发步骤
1. views/ 目录下增加组件, 也就是你想显示在屏幕中间的内容
2. src/router/index.ts 文件找到路由定义, 格式形如
```typescript
const routes: Array<RouteRecordRaw> = [
    {
        path: '/users', // 路径, 也就是浏览器导航栏 suffix 显示的路径, 一定使用 '/' 开头
        name:'Users', // 路由的名称, 全局唯一
        component: () => import('../views/JobFlow.vue'), // 步骤1中写好的组件
        meta: { title: '用户管理', icon: 'people' } // title 是屏幕左侧显示的名称, icon 是左侧显示的图标(配置请看步骤3)
    }
]
```
在 routes 中增加 element 即可
3. 在 src/components/SideBar.vue 文件中, 找到 iconMap 变量, 形如
```typescript
// 图标映射
const iconMap: Record<string, Component> = {
dashboard: DashboardIcon,
people: PeopleIcon,
cube: CubeIcon,
list: ListIcon,
settings: SettingsIcon
}
```
其中 key 是步骤二中新增的element的icon字段值, value 是 Naive-UI 图标库预定义的图标
