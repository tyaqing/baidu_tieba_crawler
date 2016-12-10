<template>
    <div class="ui container text mt-20">

        <el-card  v-loading.body="loading"
                  element-loading-text="正在爬取贴吧基本信息"
        >
            <div slot="header" class="clearfix">
                <span style="line-height: 36px;">创建目标贴吧</span>
            </div>
            <el-form :model="form" label-width="80px">
                <el-form-item label="贴吧名称">
                    <el-input @keyup.enter="onSubmit" v-model="form.name"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSubmit">立即创建</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-row :gutter="20">
            <el-col :span="12" v-for="item in card">
                <div class="mt-8 box pd-10 clearfix" :body-style="{ padding: '10px'}">
                    <img class="left" :src="item.head_img">
                    <article style="margin-left:130px">
                        <div class="f-16 c-1">{{item.kw}}</div>
                        <div class="c-green f-12"> <i class="el-icon-delete"></i>关注 : {{item.follow_sum}}</div>
                        <div class="c-green f-12"> <i class="el-icon-delete"></i>帖子 : {{item.post_sum}}</div>
                        <router-link :to="{ path: 'index/f', query: { kw: item.kw }}">
                            <el-button >查看详情</el-button>
                        </router-link>
                    </article>
                </div>
            </el-col>
        </el-row>
    </div>

</template>

<script type="javascript">
    export default{
        mounted:function(){
            this.$http.get('/api/tieba')
                    .then(function(res){
                        console.log(res.body)
                        this.card = res.body.reverse();
                    },function(res){
                        // console.log(res)
                    })
        },
        name   : 'dashboard',
        data(){
            return {
                msg : 'hello vue',
                form: {
                    name: '',
                },
                card:[],
                loading: false
            }
        },
        methods: {
            onSubmit() {
                this.loading = true;
                this.$http.post('/api/tieba',{kw:this.form.name})
                        .then((res)=>{
                            this.card.unshift(res.body)
                            this.loading = false;
                        })
            }
        },


    }

</script>

<style lang="less" scoped>
    body {
        margin: 0;
    }
    img.left{
        height: 120px;
        width: 120px;
    }
    body{
        background-color:#eee;
    }
    .h1,.h2,.h3,.text-regular,.text-small{
        color:#5e6d82;
    }
</style>