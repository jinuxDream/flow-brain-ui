# FlowBrain 前端项目

## 技术栈

- Vue 3.3.4
- Element Plus 2.3.8
- Vue Router 4
- Pinia 2.1.6
- Axios
- Vite 4.4.9

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
flow-brain-ui/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API接口
│   │   ├── repo.js        # 仓库管理API
│   │   └── knowledge.js   # 知识中心API
│   ├── assets/            # 资源文件
│   ├── components/        # 公共组件
│   ├── layouts/           # 布局组件
│   │   └── MainLayout.vue # 主布局
│   ├── router/            # 路由配置
│   │   └── index.js
│   ├── stores/            # 状态管理
│   ├── utils/             # 工具函数
│   │   └── request.js     # Axios封装
│   ├── views/             # 页面组件
│   │   ├── Dashboard.vue  # 首页
│   │   ├── repo/          # 仓库管理
│   │   │   └── RepoManagement.vue
│   │   └── knowledge/     # 知识中心
│   │       └── KnowledgeCenter.vue
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── index.html             # HTML模板
├── vite.config.js         # Vite配置
└── package.json           # 项目配置

```

## 功能模块

### 1. 首页（Dashboard）

- 核心数据卡片展示
- 快捷操作入口
- 最近同步记录
- 最近业务变更

### 2. 仓库管理

- 仓库接入管理
- 仓库扫描
- 扫描任务管理
- 仓库状态切换

### 3. 知识中心

- 业务域全景
- 流程可视化
- 节点详情查看
- 知识检索

## API配置

前端通过Vite代理转发请求到后端：

```javascript
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/flow-brain': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

## 开发规范

### 命名规范

- 组件文件：PascalCase (如：`RepoManagement.vue`)
- 其他文件：kebab-case (如：`request.js`)
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE

### 组件规范

- 使用 `<script setup>` 语法
- 使用 Composition API
- 组件按功能模块组织

### 样式规范

- 使用 scoped 样式
- 遵循 Element Plus 设计规范
- 响应式布局

## 注意事项

1. 确保后端服务已启动（http://localhost:8080）
2. 开发时使用代理，生产环境需要配置nginx
3. 所有API请求都通过 `/flow-brain` 前缀
