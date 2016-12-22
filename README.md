# baidu_tieba_crawler
##[演示地址](http://www.femirror.com/index)
服务器很慢，请原谅
##1.2更新说明
* 可以爬用户了
* 爬取过程中路由将被拦截
* 增加了两个监控，socket连接数 子进程数

##更迭期望
* 数据分析 
* 任务队列，实现无需驻足网页爬取，而是后台爬取
* 代码优化 部分重写

##项目地址
https://github.com/tyaqing/baidu_tieba_crawler
喜欢的给个star
#使用说明书
！！！爬虫类的东东还是友善使用
### 程序运行不起来就要检查下 以下接口是否替换
~ 代理的api接口  mongo地址 socket地址 ~
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
npm i          //安装后端依赖
node socket.js //运行restful api 和socket服务 默认端口8081
cd fe          //进入前端目录
npm i          //安装前端依赖
npm run dev    //运行调试模式  默认端口8080
```
*@Molunerfinn 谢谢建议*
##关于技术栈
用到的东西挺多的，但是都是用了点皮毛知识,提前踩坑。
####前端的
vue大礼包(vue-resource vue-router vue-socket.id element-ui)
####后端的
express socket.io superagent cheerio mongoose
####数据库
mongo

##1.1历史更新
* 依托socket实现一页面一进程
* 改写入口文件，精简代码，提高了爬虫效率
* 消灭了停止爬取会出现崩溃的bug
