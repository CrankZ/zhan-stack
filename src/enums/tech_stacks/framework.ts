import {
  DOTNET_MANAGERS,
  GO_MANAGERS,
  JAVA_MANAGERS,
  JS_MANAGERS,
  PYTHON_MANAGERS,
  RUST_MANAGERS,
} from '@/enums/managers';
import type { TechCategory } from '@/types';

export const framework: TechCategory = {
  id: 'framework',
  label: { zh: '框架', en: 'Framework' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'react', name: 'React' },
        { key: 'vue', name: 'Vue.js' },
        { key: 'angular', name: 'Angular' },
        { key: 'next', name: 'Next.js' },
        { key: 'nuxt', name: 'Nuxt.js' },
        { key: 'gatsby', name: 'Gatsby' },
        { key: 'svelte', name: 'Svelte' },
        { key: 'ember-source', name: 'Ember.js' },
        { key: 'preact', name: 'Preact' },
        { key: 'solid-js', name: 'Solid.js' },
      ],
    },
    {
      managers: PYTHON_MANAGERS,
      items: [
        { key: 'django', name: 'Django' },
        { key: 'flask', name: 'Flask' },
        { key: 'fastapi', name: 'FastAPI' },
        { key: 'tornado', name: 'Tornado' },
      ],
    },
    {
      managers: RUST_MANAGERS,
      items: [
        { key: 'actix-web', name: 'Actix Web' },
        { key: 'rocket', name: 'Rocket' },
        { key: 'axum', name: 'Axum' },
      ],
    },
    {
      managers: JAVA_MANAGERS,
      items: [
        { key: 'spring-core', name: 'Spring' },
        { key: 'spring-boot', name: 'Spring Boot' },
      ],
    },
    {
      managers: DOTNET_MANAGERS,
      items: [{ key: 'Microsoft.AspNetCore', name: 'ASP.NET Core' }],
    },
    {
      managers: GO_MANAGERS,
      items: [
        { key: 'github.com/gin-gonic/gin', name: 'Gin' },
        { key: 'github.com/labstack/echo/v4', name: 'Echo' },
        { key: 'github.com/gofiber/fiber/v2', name: 'Fiber' },
      ],
    },
  ],
};
