<template>
    <div class="">
        <div class="menu">
            <el-menu router theme="dark" default-active="1" class="el-menu-demo ui container text" mode="horizontal"
                     @select="handleSelect">
                <el-menu-item index="/index">主页</el-menu-item>

                <el-menu-item index=""><a target="_blank"
                                          href="https://github.com/tyaqing/baidu_tieba_crawler">Github</a>
                </el-menu-item>
            </el-menu>
        </div>
        <transition name="fade">
            <router-view>
            </router-view>
        </transition>
    </div>
</template>

<script type="javascript">
    export default {
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
                console.log(`运行了${data}个爬虫进程`);
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
