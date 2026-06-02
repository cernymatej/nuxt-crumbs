<script setup lang="ts">
import { useBreadcrumbs } from '../composables/use-breadcrumbs'

const { crumbs } = useBreadcrumbs()
</script>

<template>
  <slot v-bind="{ crumbs }" />
</template>
