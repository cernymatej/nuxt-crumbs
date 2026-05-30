# Nuxt Crumbs 🍞

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Effortless, SSR-ready breadcrumbs for your Nuxt app.

A unified way to manage breadcrumbs in your Nuxt app. Define each breadcrumb on the page where its data lives, then render the full trail anywhere you like, even from a Nuxt layout! Labels can be static or derived from data fetched on the page, with full SSR support.

## Features

- 🗺️ &nbsp;breadcrumbs generated automatically from your route hierarchy
- ⚡️ &nbsp;set crumb labels from fetched data with `defineBreadcrumbs`
- 🎨 &nbsp;fully customizable: bring your own markup and styling
- 🪶 &nbsp;lightweight and dependency-free
- 🌐 &nbsp;SSR-safe out of the box
- 💪 &nbsp;fully typed, with support for augmentation

## 🚀 Usage

### Install

1. Install the module to your project:

```sh
npm install nuxt-crumbs
```

2. Add it to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-crumbs',
  ],
})
```

### Add a crumb to a page

The simplest way to give a page a breadcrumb is through `definePageMeta`. Each matched route that declares a `breadcrumb` becomes a segment in the trail, in hierarchy order.

```vue
<!-- pages/about.vue -->
<script setup lang="ts">
definePageMeta({
  breadcrumb: 'About',
})
</script>
```

Visiting `/about` now yields a trail of: **About**. Nested routes stack automatically, so `pages/blog/[slug].vue` under `pages/blog.vue` produces **Blog › Post title**.

### Dynamic crumbs

When a label isn't known ahead of time, for example when it depends on fetched data, reach for the `defineBreadcrumbs` compiler macro. SSR waits for it to settle before rendering the breadcrumbs component.

```vue
<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
const route = useRoute()
// we await useAsyncData 👇
const { data: post } = await useAsyncData(() => fetchPost(route.params.slug))

// `post` is now available at this point,
// we can snapshot its title into the leaf breadcrumb
defineBreadcrumbs({
  label: post.value.title
})
</script>
```

Passing an object sets the crumb for the current page (the leaf of the trail). For more control, pass a callback instead. It receives a context object holding the breadcrumbs already resolved from the route hierarchy, and the returned array becomes the new trail. This is handy when a crumb further up the trail also depends on fetched data.

```ts
defineBreadcrumbs(({ crumbs }) => {
  return [
    ...crumbs.map((crumb) => {
      // use the category name from fetched data
      if (crumb.routeName === 'category-slug') {
        return { ...crumb, label: product.value.category.name }
      }
      return crumb
    }),
    // append the the leaf crumb
    { label: product.value.name },
  ]
})
```

### Rendering the trail

Use the `<NuxtCrumbs>` component to render the trail. It iterates over the resolved crumbs and exposes each one through a scoped slot, so you can bring your own markup and styling:

```vue
<template>
  <nav aria-label="Breadcrumb">
    <ul>
      <NuxtCrumbs v-slot="{ crumb }">
        <li>
          <NuxtLink :to="crumb.to">{{ crumb.label }}</NuxtLink>
        </li>
      </NuxtCrumbs>
    </ul>
  </nav>
</template>
```

Each `crumb` exposed by the slot is a resolved breadcrumb:

| Property    | Type                       | Description                                     |
| ----------- | -------------------------- | ----------------------------------------------- |
| `label`     | `string`                   | The text to display.                            |
| `to`        | `RouteLocationRaw`         | A route location ready to pass to `<NuxtLink>`. |
| `routeName` | `string \| symbol \| null` | The name of the route the crumb points to.      |

## 🧑‍💻 Contributing

- Clone this repository
- Install dependencies using `pnpm install`
- Run `pnpm dev:prepare` to generate type stubs
- Use `pnpm dev` to start the [playground](./playground) in development mode

## 📑 License

Published under the [MIT License](./LICENSE).

<!-- Badges -->
[npm-version-src]: https://npmx.dev/api/registry/badge/version/nuxt-crumbs
[npm-version-href]: https://npmx.dev/package/nuxt-crumbs

[npm-downloads-src]: https://npmx.dev/api/registry/badge/downloads/nuxt-crumbs
[npm-downloads-href]: https://npmx.dev/package/nuxt-crumbs

[license-src]: https://npmx.dev/api/registry/badge/license/nuxt-crumbs
[license-href]: https://npmx.dev/package/nuxt-crumbs

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt
[nuxt-href]: https://nuxt.com
