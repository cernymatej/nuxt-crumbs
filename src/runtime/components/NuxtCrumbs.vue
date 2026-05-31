<script setup lang="ts">
import { useBreadcrumbs } from '../composables/use-breadcrumbs'

defineOptions({
  inheritAttrs: false,
})

const { crumbs } = useBreadcrumbs()
</script>

<template>
  <template
    v-for="(crumb, index) in crumbs"
    :key="`${crumb.label}${crumb.routeName ?? ''}`"
  >
    <slot v-bind="{ crumb, index }" />
  </template>
</template>

<style scoped>

</style>
