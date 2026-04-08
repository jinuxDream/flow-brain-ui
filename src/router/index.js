import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/share/:shareCode',
    name: 'ShareAgent',
    component: () => import('@/views/share/ShareAgent.vue'),
    meta: { title: '分享对话', isSharePage: true }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页（业务驾驶舱）' }
      },
      {
        path: 'agent',
        name: 'AiAgent',
        component: () => import('@/views/agent/AiAgent.vue'),
        meta: { title: 'Tia', allowShareUser: true }
      },
      {
        path: 'navigation',
        name: 'NavigationPage',
        component: () => import('@/views/navigation/NavigationPage.vue'),
        meta: { title: '快速导航', allowShareUser: true }
      },
      {
        path: 'agent/share/:shareCode',
        name: 'AiAgentShare',
        component: () => import('@/views/agent/AiAgent.vue'),
        meta: { title: '分享对话', allowShareUser: true }
      },
      {
        path: 'repo',
        name: 'RepoManagement',
        component: () => import('@/views/repo/RepoManagement.vue'),
        meta: { title: '仓库接入管理' }
      },
      {
        path: 'repo/task',
        name: 'RepoTask',
        component: () => import('@/views/repo/RepoTask.vue'),
        meta: { title: '扫描任务管理' }
      },
      {
        path: 'knowledge/domain',
        name: 'DomainPanorama',
        component: () => import('@/views/knowledge/DomainPanorama.vue'),
        meta: { title: '业务域全景' }
      },
      {
        path: 'knowledge/flow',
        name: 'FlowList',
        component: () => import('@/views/knowledge/FlowList.vue'),
        meta: { title: '流程可视化' }
      },
      {
        path: 'knowledge/flow-graph',
        name: 'FlowRelationGraph',
        component: () => import('@/views/knowledge/FlowRelationGraph.vue'),
        meta: { title: '流程关系图' }
      },
      {
        path: 'knowledge/model',
        name: 'DataModel',
        component: () => import('@/views/knowledge/DataModel.vue'),
        meta: { title: '数据模型管理' }
      },
      {
        path: 'knowledge/search',
        name: 'KnowledgeSearch',
        component: () => import('@/views/knowledge/KnowledgeSearch.vue'),
        meta: { title: '全域知识检索' }
      },
      {
        path: 'scheme/demand',
        name: 'DemandManagement',
        component: () => import('@/views/scheme/DemandManagement.vue'),
        meta: { title: '需求管理' }
      },
      {
        path: 'scheme/generate',
        name: 'SchemeGenerate',
        component: () => import('@/views/scheme/SchemeGenerate.vue'),
        meta: { title: '方案生成管理' }
      },
      {
        path: 'system/user',
        name: 'UserManagement',
        component: () => import('@/views/system/UserManagement.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'system/model',
        name: 'ModelManagement',
        component: () => import('@/views/system/ModelManagement.vue'),
        meta: { title: '模型管理' }
      },
      {
        path: 'system/config',
        name: 'SystemConfig',
        component: () => import('@/views/system/SystemConfig.vue'),
        meta: { title: '基础配置' }
      },
      {
        path: 'system/agent',
        name: 'AgentConfigManagement',
        component: () => import('@/views/system/AgentConfigManagement.vue'),
        meta: { title: '助手管理' }
      },

      {
        path: 'datasource/connection',
        name: 'DbConnectionManagement',
        component: () => import('@/views/datasource/DbConnectionManagement.vue'),
        meta: { title: '数据库连接管理' }
      },
      {
        path: 'datasource/structure',
        name: 'TableStructureView',
        component: () => import('@/views/datasource/TableStructureView.vue'),
        meta: { title: '表结构查看' }
      },
      {
        path: 'datasource/api',
        name: 'ApiDefinitionManagement',
        component: () => import('@/views/datasource/ApiDefinitionManagement.vue'),
        meta: { title: '三方接口管理' }
      },
      {
        path: 'datasource/app',
        name: 'AppManagement',
        component: () => import('@/views/datasource/AppManagement.vue'),
        meta: { title: '应用管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - Tia` : 'Tia'
  
  const savedUser = localStorage.getItem('tia-user')
  const isLoggedIn = !!savedUser
  const isShareSession = sessionStorage.getItem('tia-share-session') === 'true'
  
  if (to.path === '/login') {
    if (isLoggedIn) {
      next('/')
    } else {
      next()
    }
  } else if (to.path.startsWith('/share/')) {
    if (isLoggedIn) {
      next()
    } else {
      next('/login?redirect=' + encodeURIComponent(to.fullPath) + '&share=1')
    }
  } else {
    if (isLoggedIn) {
      if (isShareSession && !to.meta.allowShareUser) {
        next('/agent')
      } else {
        next()
      }
    } else {
      next('/login')
    }
  }
})

export default router
