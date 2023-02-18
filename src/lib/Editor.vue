<template>
  <div ref="editor" class="prompt-editor"></div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { templateRef } from '@vueuse/core';
import * as monaco from 'monaco-editor';
import { create } from './lang';

const editor = templateRef<HTMLDivElement>('editor');

monaco.editor

watch(editor, () => {
  if (editor.value) {

    create(editor.value);
    

    // monaco.editor.create(editor.value, {
    //   value: "a,2",
    //   language: "prompt"
    // });
  }
});

const count = ref(0);
</script>
<style scoped>
.prompt-editor {
  min-height: 200px;
}
</style>
