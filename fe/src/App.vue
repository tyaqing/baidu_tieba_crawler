<template>
    <div>
        <router-view></router-view>
    </div>
</template>

<script>

    export default {
    name:'Menu',
        methods:{
        handleSelect(key, keyPath) {
        console.log(key, keyPath);
      }}
    }


</script>

<style lang="less">
    @import './assets/less/reset';
    @import './assets/less/crickets';
</style>
