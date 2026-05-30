<script setup lang="ts">
import { useBreadcrumbs } from '../composables/breadcrumbs'

defineOptions({
  inheritAttrs: false,
})

const { crumbs } = useBreadcrumbs()
</script>

<template>
  <template
    v-for="crumb in crumbs"
    :key="crumb.routeName"
  >
    <slot :crumb="crumb" />
  </template>
</template>

<style scoped>

</style>
