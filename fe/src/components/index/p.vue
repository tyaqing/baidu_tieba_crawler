<template>
    <div class="ui container text mt-20">
        <el-card>

            <div slot="header" class="clearfix">
                <span style="line-height: 36px;">{{doc.title}}</span>
                <br><br>
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                    <el-breadcrumb-item :to="{ path: '/index/f?kw='+this.$route.query.kw }">{{kw}}吧</el-breadcrumb-item>
                    <el-breadcrumb-item>{{doc.title}}</el-breadcrumb-item>
                </el-breadcrumb>

            </div>
            <div class="postlist">
                <el-button @click="getContent">获取/更新帖子内容</el-button>
                <br><br>
                <div class="f-16" v-for="(item,index) in doc.postlist">
                    {{item.user_name}}<br>
                    <!--<img v-for="img in item.img" :src="img">-->

                    <p class="f-16">{{item.content}}</p>

                    <!--{{item.comment}}-->

                    <ul v-if="item.comment">
                        <li v-for="comment in item.comment.comment_info">
                            {{comment.username}}

                            <div v-html="comment.content"></div>
                        </li>
                    </ul>
                </div>
            </div>

        </el-card>
    </div>
</template>
<style lang="less">
    .postlist {
        p {
            padding: .6rem;
        }
        p:nth-child(odd) {
            background-color: #F3F3F3;
        }
        p:nth-child(even) {
            background-color: #D8F4FD;
        }
    }

</style>
<script type="javascript">
    export default{
        mounted: function () {
            this.refresh_data();
        },
        data(){
            return {
                kw : this.$route.query.kw,
                id : this.$route.params.id,
                doc: {},
            }
        },
        methods: {
            handleSizeChange(val) {
                console.log(`每页 ${val} 条`);
            },
            handleCurrentChange(val) {
                console.log(`当前页: ${val}`);
            },
            getContent(){
                this.$message('正在抓取,请稍等');
                this.$http.get(`/api/get_tieba_content?pid=${this.id}`)
                        .then((res) => {
                            this.$message({
                                type   : Object.keys(res.body)[0],
                                message: Object.values(res.body)[0],
                            });
                            this.refresh_data();

                        })
            },
            refresh_data(){
                this.$http.get(`/api/p/${this.id}`)
                        .then((res) => {
                            this.doc = res.body;
                        })
            }
        },
        filters: {
            capitalize: function (value) {
                console.log(value);
                if (!value) return ''
                value = value.toString()
                return value.charAt(0).toUpperCase() + value.slice(1)
            }
        },
    }
</script>
