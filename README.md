# baidu_tieba_crawler

#使用说明书
！！！爬虫类的东东还是友善使用
##先说下目录结构
```
├─model              mongooes 模型  Scheme
│  ├─model.js        定义了数据库模型 
├─server             运行socket 和 api的服务端代码
│  ├─api.js          express路由生成的 restful api
│  ├─api_action.js   api.js 会调用我的函数 
│  ├─cp.js           socket.js会通过child_process调用我 我只运行在子进程里
├─fe                 vue-cli 生成的 Webpack 打包工具 便于调试。
│  │  ├─src          其他没什么好介绍的了
```
##真·调试
```
node socket.js //运行restful api 和socket服务
cd fe && npm run dev   //运行调试模式
```
##关于技术栈
用到的东西挺多的，但是都是用了点皮毛知识,提前踩坑。
####前端的
vue大礼包(vue-resource vue-router vue-socket.id element-ui)
####后端的
express socket.io superagent cheerio mongoose
####数据库
mongo
