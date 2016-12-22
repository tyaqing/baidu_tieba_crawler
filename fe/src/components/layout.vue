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
                    <transition  name="fade">
                        <router-view >

                        </router-view>
                    </transition>
                </el-col>
                <el-col class="mt-20" :span="6">
                    <el-card>
                        正在执行的进程
                        {{worker_sum.worker_sum}}
                        链接数量
                        {{worker_sum.connectCounter}}
                    </el-card>
                </el-col>
            </el-row>
        </div>



    </div>
</template>

<script type="javascript">
    export default {
    data(){
        return{
            worker_sum:{},
        }
    },
        name   : 'Hello',
        methods: {
            handleSelect(key, keyPath) {
                console.log(key, keyPath);
            }
        },
        // 总socket监听器 仅用于消息通讯
        sockets: {
            connect: function (data) {
                console.log('socket链接成功');
            },
            success: function (data) {
                this.$notify({
                    title: '成功',
                    message: data,
                    type: 'success'
                });
            },
            warning: function (data) {
                this.$notify({
                    title: '警告',
                    message: data,
                    type: 'warning'
                });
            },
            error  : function (data) {
                this.$notify({
                    title: '错误',
                    message: data,
                    type: 'error'
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
            //正在运行进程的个数
            worker_sum:function(data){
                this.worker_sum = data;
                console.log(data);
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
    .monit{
        background-color: #ccc;
        /*width: 150px;*/
        /*position: fixed;*/
        /*left: 20px;*/
        /*top: 80px;*/
    }
</style>
