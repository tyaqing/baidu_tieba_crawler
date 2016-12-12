<template>
    <div class="">
        <div class="menu">
            <el-menu router theme="dark" default-active="1" class="el-menu-demo ui container text" mode="horizontal"
                     @select="handleSelect">
                <el-menu-item index="/index">主页</el-menu-item>

                <el-menu-item ><a target="_blank" href="https://github.com/tyaqing/baidu_tieba_crawler">Github</a></el-menu-item>
            </el-menu>
        </div>

        <transition name="fade">
            <router-view>
            </router-view>
        </transition>

    </div>
</template>

<script>
    export default {
        name   : 'Hello',
        methods: {
            handleSelect(key, keyPath) {
                console.log(key, keyPath);
            }
        }
    }
</script>
<style lang="less" scoped>
    .el-menu {
    a {
        display: block;
        color: inherit;
        text-decoration: none;
    }

    }
    .menu {
        background-color: #324055;
    }
</style>
