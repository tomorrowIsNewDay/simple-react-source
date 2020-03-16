# simple-react-source
手写react 源码 简版

## simple-source/index.js
## 核心API
- createElement,
- render,
- useState,
- transfer,
- Component

### jsx语法
    调用的是React.createElement(type, props, ...children) 
    生成vdom
    const ele = <div id='box'><p class='content'>react</p></div>
    {
        type: 'div',
        props: {
            id: 'box',
            children: [
                type: 'p',
                props: {
                    class: 'content',
                    children: [{
                        type: 'TEXT',
                        props: {
                            nodeValue: 'react',
                            children: []
                        }
                    }]
                }
            ]
        }
    }

### render(vdom, container)
    渲染fiberTree


### Fiber 
    v16版本前渲染是同步的，碰到嵌套比较深的组件，渲染耗时，丢帧，页面显示会有卡顿，用户体验差
    v16及以后版本引入的'时间片的概念'，将任务分成过多个任务单元（nextUnitOfWork）,在每个fiber上携带expireTime(过期时间)，用来判断任务的优先级，遇到优先级高的任务(动画，页面交互等)执行栈先执行，暂停当前的fiber渲染，等优先级高的任务完成后，再继续执行当前的fiber任务
    利用了浏览器的API，requestIdleCallback(cb), 当浏览器空闲的时间处理任务，react源码模拟了这个api,本文用了此api
    浏览器渲染：一般60hz,即一帧的时间为16.6ms,这一帧的时间内浏览器完成，js解析执行，事件处理，requestAnimationFrame(),layout, paint等，如果完成了这一系列动作后，还有剩余时间，即上面所说的浏览器空闲时间
    ** fiber采用链表结构，优点是便于编辑，O(1),便于单元任务的暂停和恢复 **

    FiberRoot {
        dom: 真实dom,
        props: 属性,
        child: 子fiber，
        silibing: 兄弟fiber,
        parent: 父fiber,
        alternate: oldFiberRoot,
        effectTag: "UPDATE",
    }

### 全局变量
    let nextUnitOfWork = null // 单元任务
    let workInprogress = null //正在工作的fiber根节点
    let currentRoot = null // 被中断前工作的fiber根节点

### schedle调度阶段
    requestIdleCallback(workLoop)
    workLoop() 方法
    - 当有空闲时间时，获取下一个nextUnitOfWork
    - 当自上而下遍历完成后，则commitRoot()挂载真实dom到浏览器


