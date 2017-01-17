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
                        <el-card>
                            <el-row class="t-center stats" :gutter="20">
                                <el-col :span="12">
                                    <div>当前任务</div>
                                    <el-tag>{{stats.count.inactiveCount}}</el-tag>
                                </el-col>
                                <el-col :span="12">
                                    <div>进行的任务</div>
                                    <el-tag type="primary">{{stats.count.activeCount}}</el-tag>
                                </el-col>

                                <el-col :span="12">
                                    <div>完成任务</div>
                                    <el-tag type="success">{{stats.count.completeCount}}</el-tag>
                                </el-col>
                                <el-col :span="12">
                                    <div>失败任务</div>
                                    <el-tag type="danger">{{stats.count.failedCount}}</el-tag>

                                </el-col>
                                <el-col :span="12">
                                    <div>爬用户任务</div>
                                    <el-tag type="primary">{{stats.count.user}}</el-tag>

                                </el-col>
                                <el-col :span="12">
                                    <div>工作时间</div>
                                    <el-tag type="primary">{{parseInt(stats.count.workTime/1000/60)}}m</el-tag>

                                </el-col>
                            </el-row>
                        </el-card>
                        <el-card class="queue-card" v-for="(item, index) in stats.tieba">
                            <span  class="h3"> {{item.kw}} </span>
                            <span>总页数{{item.page_sum}}</span>
                        </el-card>
                        <br>

                        <el-button @click="queue_clear" type="danger">清空队列</el-button>
                    </el-card>
                    <el-card class="mt-10">

                            <div slot="header">
                                <el-tooltip class="item" effect="dark" content="进程创建越多，队列处理越快" placement="left-start">
                                    <h2>队列处理进程</h2>
                                </el-tooltip>
                            </div>
                        当前进程数 {{0||stats.cp.sum}} 最大进程数 {{0||stats.cp.limit}}
                        <br><br>
                        <el-button @click="create_process" type="primary">创建进程</el-button>
                        <el-button @click="delete_process" type="danger">删除进程</el-button>



                    </el-card>
                </el-col>
            </el-row>
        </div>


    </div>
</template>

<script type="javascript">
    export default {
        data(){
            return {
                worker_sum: {},
                stats     : {
                    cp:{
                        sum:0,
                        limit:0
                    },
                    count:{}
                },
                cp_sum :0,
            }
        },
        name   : 'Hello',
        methods: {
            handleSelect(key, keyPath) {
                console.log(key, keyPath);
            },
            queue_clear(){
                this.$confirm('此操作将清空所有队列, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText : '取消',
                    type             : 'warning'
                }).then(() => {
                    this.$http.get('/api/queue/clean')
                            .then(function (res) {
                                this.$message({
                                    type   : Object.keys(res.body)[0],
                                    message: Object.values(res.body)[0],
                                });
                            });
                }).catch(() => {
                    this.$message({
                        type   : 'info',
                        message: '已取消删除'
                    });
                })
            },
            create_process(){
                this.$http.get('/api/queue/manage?type=create_process')
                        .then(function(res){
                            this.$message({
                                type   : Object.keys(res.body)[0],
                                message: Object.values(res.body)[0],
                            });
                        })
            },
            delete_process(){
                this.$confirm('没有任务的时候可以删除进程, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText : '取消',
                    type             : 'warning'
                }).then(() => {
                    this.$http.get('/api/queue/manage?type=delete_process')
                            .then(function(res){
                                this.$message({
                                    type   : Object.keys(res.body)[0],
                                    message: Object.values(res.body)[0],
                                });
                            })
                }).catch(() => {
                    this.$message({
                        type   : 'info',
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
            stats: function (data) {
               this.stats = data;
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
    .stats{
        .el-col{
            margin: 10px 0 ;
        }
    }
    .queue-card{
        margin: 5px 0;
    }
    .el-tag{
        margin-top: 5px;
    }

</style>
