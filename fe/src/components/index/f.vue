<template>
    <div class="mt-20">
        <el-card>

            <div slot="header" class="clearfix">

                <span style="line-height: 36px;">{{kw.toUpperCase()}}吧</span>
                <br><br>
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                    <el-breadcrumb-item>{{kw.toUpperCase()}}吧</el-breadcrumb-item>
                </el-breadcrumb>
            </div>
            <el-button type="disable" @click="start">加入任务队列</el-button>
            <router-link class="right"  :to="{ path: '/index/listMember', query: { kw: this.$route.query.kw }}">
                <el-button type="primary" >会员列表</el-button>
            </router-link>
            <br><br>
            <!--<el-card>-->
                <!--<el-row>-->
                    <!--<div class="f-16 c-2">队列进度</div>-->
                    <!--<el-col :span="24">-->
                        <!--<el-progress :text-inside="false" :stroke-width="10" :percentage="process"></el-progress>-->

                    <!--</el-col>-->
                <!--</el-row>-->
            <!--</el-card>-->
            <br><br>
            <el-table
                    :data="tableData"
                    stripe
                    style="width: 100%">
                <el-table-column
                        prop="title"
                        label="帖子"
                        >
                </el-table-column>
                <el-table-column
                        prop="user_name"
                        width="150"
                        label="发帖人"
                        >
                </el-table-column>
                <el-table-column
                        inline-template
                        :context="_self"
                        label="操作"
                        width="70"
                        >
                      <span>
                       <router-link target="_blank" :to="{path:'p/:id',name:'p',params:{id:row._id},query: { kw:kw}}"> <el-button type="text" size="small">详情</el-button></router-link>
                      </span>
                </el-table-column>
            </el-table>

            <div class="block t-center mt-20">
                <el-pagination
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                        :current-page="1"
                        :page-sizes="[30, 50, 100, 200]"
                        :page-size="page_size"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="count">
                </el-pagination>
            </div>
        </el-card>
        <br><br><br>
    </div>

</template>
<style>

</style>
<script type="javascript">
    export default{
        mounted:function(){
            this.dataRefresh();
        },
        data(){
            return {
                kw:this.$route.query.kw,
                tableData: [],
                limit:50,
                skip:0,
                count:0,
                page_size:50,
                current_page:1,
                msg:'',
                process:0,
                process_total:0,
                process_start:false
            }
        },
        beforeRouteLeave (to, from, next) {
            // 判断是否正在爬取
            if(!this.process_start||this.process==100){
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
                this.dataRefresh();
            },
            handleCurrentChange(val) {
                console.log(`当前页: ${val}`);
                this.current_page = val;
                this.limit = this.page_size;
                this.skip = this.page_size * (val-1);
                this.dataRefresh();
            },
            dataRefresh(){
                this.$http.get(`/api/p?limit=${this.limit}&skip=${this.skip}&kw=${this.kw}`)
                        .then(function(res){
                            this.tableData = res.body.data;
                            this.count = res.body.count;
                        })
            },
            start(){
                this.$http.get(`/api/queue/get_tieba_list?kw=${this.kw}`)
                        .then(function(res){
                            this.$message({
                                type:Object.keys(res.body)[0],
                                message:Object.values(res.body)[0],
                            });
                        });
            },
            listMemberInfo(){
                location.href="/index/listMember";
            }

        },
        // sockets:{
        //     now_num: function (data) {
        //         console.log(data);
        //         if (data == 0) return;
        //         this.process = parseInt(data / this.process_total * 100);
        //     },
        //     total  : function (data) {
        //         console.log(data);
        //         this.process_total = parseInt(data);
        //     }
        // }
    }

</script>
