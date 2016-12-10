<template>
    <div class="ui container text">
        <el-tag>标签一</el-tag>
        <el-tag type="gray">标签二</el-tag>
        <div class="block">
            <span class="demonstration">默认显示颜色</span>
            <span class="wrapper">
            <el-button type="success">成功按钮</el-button>
            <el-button type="warning">警告按钮</el-button>
                <el-button type="danger">危险按钮</el-button>
            <el-button type="info">信息按钮</el-button>
        </span>
        </div>
        <div class="block">
            <span class="demonstration">hover 显示颜色</span>
            <span class="wrapper">
    <el-button :plain="true" type="success">成功按钮</el-button>
    <el-button :plain="true" type="warning">警告按钮</el-button>
    <el-button :plain="true" type="danger">危险按钮</el-button>
    <el-button :plain="true" type="info">信息按钮</el-button>
  </span>
        </div>
    </div>
</template>
<style>
    body {
        background-color: #eee;
    }






</style>
<script>

    export default{
        name: 'dashboard',
        data(){
            return {
                msg: 'hello vue'
            }
        },

    }






</script>
