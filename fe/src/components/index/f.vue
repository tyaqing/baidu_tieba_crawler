<template>
    <div class=" ui container text mt-20">
        <el-card>

            <div slot="header" class="clearfix">
                <span style="line-height: 36px;">{{kw}}吧</span>

            </div>
            <el-button @click="start">开始爬取</el-button>
            <el-button @click="close">停止爬取</el-button>
            <br><br>
            <el-row>
                <el-col :span="24">
                    <el-progress :text-inside="false" :stroke-width="40" :percentage="process"></el-progress>

                </el-col>
            </el-row>
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
                       <router-link :to="{name:'p',params:{id:row._id}}"> <el-button type="text" size="small">详情</el-button></router-link>
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
            this.$http.get(`/api/p?limit=${this.limit}&skip=${this.skip}&kw=${this.kw}`)
                    .then(function(res){
                        this.tableData = res.body.data;
                        this.count = res.body.count;
                    })
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
            }
        },
        components: {},
        methods   : {
            handleSizeChange(val) {
                console.log(this.current_page);
                console.log(`每页 ${val} 条`);
                this.limit = val;
                this.page_size = val;
                this.skip = this.page_size * (this.current_page-1);
                this.$http.get(`/api/p?limit=${this.limit}&skip=${this.skip}&kw=${this.kw}`)
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
                this.$http.get(`/api/p?limit=${this.limit}&skip=${this.skip}&kw=${this.kw}`)
                        .then(function(res){
                            this.tableData = res.body.data;
                            this.count = res.body.count;
                        })
            },
            start(){
                // 爬贴内内容
                console.log(this.kw)
                this.$socket.emit('Client_order',{order:'get_tieba_list',data:this.kw})
            },
            close(){
                this.$socket.emit('Client_order',{order:'close',data:this.kw})
            }

        },
        sockets:{
            connect:function(){
                console.log('socket链接成功');
            },
            news:function(res){
                console.log(res)
                let type = res.type;
                let data  =res.data;
                if(type=='msg'){
                    this.$notify({
                        title: '提示',
                        message: data,
                        duration: 2000
                    });

                }else if(type=='now_num'){
                    if(data==0) return;
                    this.process =    parseInt(data /this.process_total *100);

                }else if(type=='total'){
                    this.process_total = parseInt(data);
                }

            }
        }
    }

</script>
