<template>
    <div class="ui container text mt-20">
        <el-card>
            <div slot="header">
                {{doc.title}}
            </div>
            <div class="postlist">
                <el-button @click="getContent">获取/更新帖子内容</el-button>
                <br><br>
                <div class="f-12" v-for="(item,index) in doc.postlist">
                    {{item.user_name}}<br>
                    <!--<img v-for="img in item.img" :src="img">-->

                    <p class="f-12">{{item.content}}</p>

                    <!--{{item.comment}}-->

                    <ul v-if="item.comment">
                        <li v-for="comment in item.comment.comment_info" >
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
    .postlist{
        p{
            padding: .6rem;
        }
        p:nth-child(odd){
            background-color:#F3F3F3;
        }
        p:nth-child(even){
            background-color: #D8F4FD;
        }
    }

</style>
<script type="javascript">
    export default{
        mounted   : function () {
            this.$http.get(`/api/p/${this.id}`)
                    .then((res) => {
                        this.doc = res.body;
                    })
        },
        data(){
            return {
                id : this.$route.params.id,
                doc: {},
            }
        },
        components: {},
        methods   : {
            handleSizeChange(val) {
                console.log(`每页 ${val} 条`);
            },
            handleCurrentChange(val) {
                console.log(`当前页: ${val}`);
            },
            getContent(){
                this.$socket.emit('get_tieba_content', this.id);
            },
            showattip(){},
            hideattip(){},
        },
        filters: {
            capitalize: function (value) {
                console.log(value);
                if (!value) return ''
                value = value.toString()
                return value.charAt(0).toUpperCase() + value.slice(1)
            }
        },
        sockets:{
            get_content:function(data){
                console.log(data);
                this.$http.get(`/api/p/${this.id}`)
                        .then((res) => {
                            this.doc = res.body;
                        })
            }
        },
    }
</script>
