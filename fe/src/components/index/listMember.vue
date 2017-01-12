<template>
    <div class="mt-20">
        <el-card>

            <div slot="header" class="clearfix">
                <span style="line-height: 36px;">{{kw.toUpperCase()}}吧-会员列表</span>
                <br><br>
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                    <el-breadcrumb-item :to="{ path: '/index/f?kw='+this.$route.query.kw }">{{kw.toUpperCase()}}吧</el-breadcrumb-item>
                    <el-breadcrumb-item>会员列表</el-breadcrumb-item>
                </el-breadcrumb>

            </div>
            <el-button @click="start">创建爬取任务</el-button>

            <br><br>
            <el-card v-show="1||process_start">
                <el-row>
                    <div class="f-16 c-2">爬取进度 : <el-tag type="success">{{tip}}</el-tag></div>
                    <el-col :span="24">
                    </el-col>
                </el-row>
            </el-card>
            <br>


            <el-row  :gutter="20">
                <el-col class="user-card" v-for="item in tableData" :span="8">
                    <img width="50" height="50"  :src="item.portrait">
                    <div class="user-info">
                        <div>
                            <span class="f-14 c-3">{{item.name}}</span>
                        </div>
                        <div>
                            <el-tag v-if="item.sex == 'male'" type="primary">男</el-tag>
                            <el-tag v-else type="danger">女</el-tag>
                            <el-tag v-if="item.vip_level != 0" type="warning">VIP:Lv{{item.vip_level}}</el-tag>
                            <el-tag v-if="item.tieba_list[0].bazhu&&item.tieba_list[0].bazhu!=''" type="success">{{item.tieba_list[0].bazhu}}</el-tag>
                        </div>
                        <div class="c-4">
                            <span class="f-12 ">吧龄 {{item.user_age}}</span>
                            <span class="f-12 ">发帖数 {{item.post_total}}</span>
                        </div>

                    </div>

                </el-col>

            </el-row>


            <div class="block t-center mt-20">
                <el-pagination
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                        :current-page="1"
                        :page-sizes="[24, 50, 100, 200]"
                        :page-size="page_size"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="count">
                </el-pagination>
            </div>
        </el-card>
        <br><br><br>
    </div>

</template>
<style lang="less">
    .user-card{
        height: 100px;
        box-shadow:0 0 1px #ccc;
        img{
            float: left;
            border-radius: 100%;
            margin: 10px 0 0 0;
        }
        .user-info{
            margin-left: 60px;
        }
    }
</style>
<script type="javascript">
    export default{
        mounted:function(){
            this.$http.get(`/api/user?limit=${this.limit}&skip=${this.skip}&kw=${this.kw}`)
                    .then(function(res){
                        this.tableData = res.body.data;
                        this.count = res.body.count;
                    })
        },
        data(){
            return {
                kw:this.$route.query.kw,
                tableData: [],
                limit:24,
                skip:0,
                count:0,
                page_size:24,
                current_page:1,
                msg:'',
                process:0,
                process_total:0,
                process_start:false,
                tip:'无'
            }
        },
        beforeRouteLeave (to, from, next) {
            // 判断是否正在爬取
            if(!this.process_start){
                next();
                return;
            }
            this.$confirm('离开当前页面将中断爬取', '发现您正在爬取内容', {
                confirmButtonText: '确定离开',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.$socket.emit('close','back_close');
                next();
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '已取消'
                });
            });
        },
        methods   : {
            handleSizeChange(val) {
                console.log(this.current_page);
                console.log(`每页 ${val} 条`);
                this.limit = val;
                this.page_size = val;
                this.skip = this.page_size * (this.current_page-1);
                this.$http.get(`/api/user?limit=${this.limit}&skip=${this.skip}&kw=${this.kw}`)
                        .then(function(res){
                            this.tableData = res.body.data;
                            this.count = res.body.count;
                        })
            },
            handleCurrentChange(val) {
                console.log(`当前页: ${val}`);
                this.current_page = val;
                this.limit = this.page_size;
                this.skip = this.page_size * (val-1);
                this.$http.get(`/api/user?limit=${this.limit}&skip=${this.skip}&kw=${this.kw}`)
                        .then(function(res){
                            this.tableData = res.body.data;
                            this.count = res.body.count;
                        })
            },
            start(){
                // 爬贴内内容
                this.$http.get(`/api/queue/get_member_list?kw=${this.kw}`)
                        .then(function(res){
                            this.$message({
                                type:Object.keys(res.body)[0],
                                message:Object.values(res.body)[0],
                            });
                        });
            },
            listMemberInfo(){
                location.href="";
            }

        },
        sockets:{
            user_process: function (data) {
                if(data=='close'){
                    this.process_start=false;
                }
                this.tip=`发现用户 ${data.name} 等级 ${data.level} `;
                console.log(data);
            },
        }
    }

</script>
