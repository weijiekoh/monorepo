import Vue from 'vue'
import VueRouter from 'vue-router'
import ProjectList from '../views/ProjectList.vue'
import About from '../views/About.vue'
import ProjectView from '../views/Project.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'projects',
    component: ProjectList,
  },
  {
    path: '/about',
    name: 'about',
    component: About,
  },
  {
    path: '/project/:address',
    name: 'project',
    component: ProjectView,
  },
]

const router = new VueRouter({
  base: window.location.pathname,
  routes,
})

export default router
