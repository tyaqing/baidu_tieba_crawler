const lazyLoading = (name, index = false) => require(`components/${name}${index ? '/index' : ''}.vue`)
export default{
    mode  : 'history',
    base  : __dirname,
    routes: [
        {path: '/', redirect: '/index'},
        {
            path    : '/index', component: require('components/layout'),
            children: [
                {path: '', component: lazyLoading('index/index')},
                {path: 'dashboard', component: lazyLoading('index/dashboard')},
                {path:'f',component:lazyLoading('index/f')},
                {path:'p/:id',name:'p',component:lazyLoading('index/p')}
            ]


        },
        {path: '*', component: lazyLoading('public/error404')}
    ]

}