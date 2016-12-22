<template>
    <div class="mt-20">
        <el-card>

            <div slot="header" class="clearfix">
                <span style="line-height: 36px;">数据分析 //TODO</span>
                <br><br>
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item :to="{ path: '/' }">数据分析</el-breadcrumb-item>
                </el-breadcrumb>
            </div>

            <el-tabs :active-name="activeName">
                <el-tab-pane label="贴吧排名" name="first">

                </el-tab-pane>
                <el-tab-pane label="男女比例" name="second">

                </el-tab-pane>
                <el-tab-pane label="大会儿出主意" name="third">

                </el-tab-pane>
            </el-tabs>
        </el-card>
        </div>
</template>
<script type="javascript">
    export default{
        data(){
            return{
                msg:'hello vue',
                activeName: 'first'
            }
        },
        components:{
        }
    }
</script>
<style lang="less">
  
</style>