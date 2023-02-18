<script setup lang="ts">
import Editor from './lib/Editor.vue';
</script>

<template>
  <div>
    <div class="info">
      现在还在开发中，编辑器这里还只支持括号语法，其他的 parser
      已经支持了，但是还没有集成进来，
      <br />
      想做到的是鼠标移上去可以看到优先级、词组和单词的翻译（数据还没接入）、特殊语法的解释等等。
    </div>
    <Editor class="editor" />
  </div>
</template>

<style scoped>
.info {
  margin-top: 20px;
  text-align: center;
  height: 10vh;
}
.editor {
  width: 100vw;
  height: 85vh;
}
</style>
