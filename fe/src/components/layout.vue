<template>
    <div class="">
        <div class="menu">
            <el-menu router theme="dark" default-active="1" class="el-menu-demo ui container text" mode="horizontal"
                     @select="handleSelect">
                <el-menu-item index="/index">主页</el-menu-item>
                <el-submenu index="2">
                    <template slot="title">我的工作台</template>
                    <el-menu-item index="/index">Hom</el-menu-item>
                    <el-menu-item index="/index/dashboard">选项2</el-menu-item>
                    <el-menu-item index="/2-3">选项3</el-menu-item>
                </el-submenu>
                <el-menu-item index="3">订单管理</el-menu-item>
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
