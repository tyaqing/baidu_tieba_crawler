<template>
    <div class="">
        <div class="menu">
            <el-menu router theme="dark" default-active="1" class="el-menu-demo ui container" mode="horizontal"
                     @select="handleSelect">
                <el-menu-item index="/index">主页</el-menu-item>

                <el-menu-item index="/analysis">数据分析</el-menu-item>

                <el-menu-item index=""><a target="_blank"
                                          href="https://github.com/tyaqing/baidu_tieba_crawler">Github</a>
                </el-menu-item>
            </el-menu>
        </div>
        <div class="ui container mt-20">

            <el-row :gutter="20">
                <el-col :span="18">
                    <transition name="fade">
                        <router-view>

                        </router-view>
                    </transition>
                </el-col>
                <el-col class="mt-20" :span="6">
                    <el-card>
                        <div slot="header" class="clearfix">
                            <h2>正在队列中的贴吧</h2>
                        </div>

                        <br>
                        <div v-for="item in queue">
                           <h3  class="h3"> {{item.kw}}</h3>
                            <span>{{item.page_sum}}</span> <a>操作</a>
                            <el-progress :text-inside="true" :stroke-width="18" :percentage="0"></el-progress>
                        </div>

                        <el-button @click="queue_clear" type="danger">清空队列</el-button>
                    </el-card>
                    <el-card class="mt-10">
                        <div slot="header">
                            <h2>队列处理进程</h2>
                        </div>
                        <br>
                        <div v-for="item in queue">
                            <h3  class="h3"> {{item.kw}}</h3>
                            <span>{{item.page_sum}}</span>
                            <el-progress :text-inside="true" :stroke-width="18" :percentage="0"></el-progress>
                        </div>
                        <br>
                        <h2 class="pd-6">队列处理进程</h2>
                        <el-button>创建一个处理进程</el-button>


                    </el-card>
                </el-col>
            </el-row>
        </div>


    </div>
</template>

<script type="javascript">
    export default {
        mounted: function () {
            this.$http.get('/api/queue/status')
                    .then(function (res) {
                        this.queue = res.body;
                    })
        },
        data(){
            return {
                worker_sum: {},
                queue:[]
            }
        },
        name   : 'Hello',
        methods: {
            handleSelect(key, keyPath) {
                console.log(key, keyPath);
            },
            queue_clear(){
                this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.$message({
                        type: 'success',
                        message: '删除成功!'
                    });
                }).catch(() => {
                    this.$message({
                        type: 'info',
                        message: '已取消删除'
                    });
                })
            }
        },
        // 总socket监听器 仅用于消息通讯
        sockets: {
            connect: function (data) {
                console.log('socket链接成功');
            },
            success: function (data) {
                this.$notify({
                    title  : '成功',
                    message: data,
                    type   : 'success'
                });
            },
            warning: function (data) {
                this.$notify({
                    title  : '警告',
                    message: data,
                    type   : 'warning'
                });
            },
            error  : function (data) {
                this.$notify({
                    title  : '错误',
                    message: data,
                    type   : 'error'
                });
            },
            info   : function (data) {
                this.$notify({
                    title   : '提示',
                    message : data,
                    duration: 2000,
                    type    : 'info'
                });
            },
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

    .monit {
        background-color: #ccc;
        /*width: 150px;*/
        /*position: fixed;*/
        /*left: 20px;*/
        /*top: 80px;*/
    }
</style>
