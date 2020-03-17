/** fiber 结构，使用链表结构，便于任务暂停恢复 */
/** 全局变量 */
let nextUnitOfWork = null // 单元任务
let workInprogress = null //正在工作的fiber根节点
let currentRoot = null // 被中断前工作的fiber根节点
let deletions  // 删除dom集合

/** createElement
 * jsx通过babel-loader调用React.createElement()
 * 生成vdom
 * @param {} type //0:文本 1: 原生 3: function组件 4:class组件
*/
function createElement(type, props, ...children) {
    delete props.__source
    delete props.__self
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
        }
    }
}
/**
 * 创建文本节点
 * @param {*} text 
 */
function createTextElement(text) {
    return {
        type: 'TEXT',
        props: {
            nodeValue: text,
            children: []
        }
    }
}

/**
 * 创建真实dom
 * @param {*} vdom 
 */
function createDom(vdom) {
    const dom = vdom.type === 'TEXT' 
                ? document.createTextNode('')
                : document.createElement(vdom.type)
    updateDom(dom, {}, vdom.props)
    return dom           
}
/** dom 更新 props */
function updateDom(dom, prevProps, nextProps) {
    Object.keys(prevProps)
        .filter(v => v !== 'children')
        .filter(v => !(v in nextProps))
        .forEach(v => {
            // 删除
            if(v.slice(0,2) === 'on') {
                dom.removeEventListener(v.slice(2).toLowerCase(), prevProps[v], false)
            }else{
                dom[v] = ''
            }
        })
    Object.keys(nextProps)
        .filter(v => v !== 'children')
        .forEach(v => {
            if(v.slice(0,2) === 'on') {
                dom.addEventListener(v.slice(2).toLowerCase(), nextProps[v], false)
            }else{
                dom[v] = nextProps[v]
            }
        })    
}

/**
 * render
 * @param {vdom} vdom 
 * @param {dom} container 
 */
function render(vdom, container) {
    // container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
    // 初始化fiber根节点
    workInprogress = {
        dom: container,
        props: {
            children: [vdom]
        },
        alternate: currentRoot //上一个工作fiber根节点
    }
    // 初始化单元任务
    nextUnitOfWork = workInprogress
}

/**
 * 浏览器空闲的时间，来处理任务
 * 调度阶段
 */
requestIdleCallback(workLoop)

function workLoop(deadline) {
    // 当前有任务且当前帧还有时间
    while(nextUnitOfWork && deadline.timeRemaining() > 1) {
        // 获取下一个单元任务
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork) 
    }
    // 没有下一个单元任务 且生成了新的fiber root, 则挂载
    if(!nextUnitOfWork && workInprogress) {
        commitRoot()
    }
    requestIdleCallback(workLoop)
}

function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function
    if(isFunctionComponent) {
        updateFunctionComponent(fiber)
    }else{
        updateHostComponent(fiber)
    }

    // 返回下一个单元任务
    if(fiber.child) {
        return fiber.child
    }
    // 有兄弟节点则返回兄弟节点， 没有则返回父节点
    let nextFiber = fiber
    while(nextFiber.sibling){
        return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
}

/**
 * 提交，真实dom挂载到页面上，不能打断
 */
function commitRoot() {
    deletions.forEach(commitWork)
    commitWork(workInprogress.child)
    // 提交换， 赋值为null
    currentRoot = workInprogress
    workInprogress = null
}

function commitWork(fiber) {
    if(!fiber) return

    let domParentFiber = fiber.parent
    while(!domParentFiber.dom) {
        // 找到有dom的fiber
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom
    if(fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
        domParent.appendChild(fiber.dom)
    }else if(fiber.effectTag === 'UPDATE' && fiber.dom != null) {
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        )
    }else if(fiber.effectTag === 'DELETION') {
        commitDeletion(fiber, domParent)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling) 
}

function commitDeletion(fiber, domParent) {
    if(fiber.dom) {
        domParent.removeChild(fiber.dom)
    }else{
        commitDeletion(fiber.child, domParent)
    }
}

/**
 * 调和
 * @param {fiberRoot } fiberRoot 
 * @param {children} elements 
 */
function reconcileChildren(fiberRoot, elements) {
    let index = 0
    let prevSibling = null
    // 获取上一次的 chidlren
    let oldFiber = fiberRoot.alternate && fiberRoot.alternate.children

    while(index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber = null
        // diff
        const sameType = oldFiber && element && element.type === oldFiber.type
        if(sameType) {
            // update 复用
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: fiberRoot,
                alternate: oldFiber,
                effectTag: "UPDATE",
              }
        }
        if(element && !sameType) {
            // add
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: fiberRoot,
                alternate: null,
                effectTag: 'PLACEMENT'
            }
        }
        if(oldFiber && !sameType) {
            // delete
            oldFiber.effectTag = 'DELETION'
            deletions.push(oldFiber)
        }
        if(oldFiber) {
            oldFiber = oldFiber.sibling
        }
   
        // 第一个设为子元素，其他的设为第一个元素的兄弟节点
        if(index === 0) {
            fiberRoot.child = newFiber
        }else if(element){
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber
        index++
    }
}

function updateHostComponent(fiber) {
    if(!fiber.dom) {
        // 不是初始化单元任务
        fiber.dom = createDom(fiber)
    }
    // if(fiber.parent) {
    //     // 插入到父节点中
    //     fiber.parent.dom.appendChild(fiber.dom)
    // }
    // 遍历自元素，生产链表结构， fiber tree
    const elements = fiber.props.children
    reconcileChildren(fiber, elements)
}

let hookIndex = null

function updateFunctionComponent(fiber) {
    hookIndex = 0
    workInprogress = fiber
    workInprogress.hooks = []
    // 执行函数, 传入props
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}
/**
 * demo: const [count, setCount] = useState(1)
 *        cb: setCount(count+1)
 * @param {*} init 
 */
function useState(init) {
    // 从上一个根节点获取hooks
    const oldHook = workInprogress.alternate 
                    && workInprogress.alternate.hooks 
                    && workInprogress.alternate.hooks[hookIndex]
    const hook = {
        state: oldHook ? oldHook.state : init, // 1 -- 1
        queue: []
    }
    // 生成新的state, 所以说hooks 每次都会生成新的state
    const actions = oldHook ? oldHook.queue : [] // [] -- []
    actions.forEach(action => {
        hook.state = action // 2
    })
    const setState = action => {
        hook.queue.push(action) // [count+1]
        workInprogress = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }
        nextUnitOfWork = workInprogress
        deletions = []
    }

    workInprogress.hooks.push(hook) // {state:1, queue: []} -- {state:2, queue:[count+1]}
    hookIndex++
    return [hook.state, setState]
}

class Component {
    constructor(props) {
        this.props = props
    }
}

function transfer(Component) {
    return function (props) {
        const component = new Component(props)
        let initState = useState
        let [state, setState] = initState(component.state)
        component.props = props
        component.state = state
        component.setState = setState
        return component.render()
    }
}

export default {
    createElement,
    render,
    useState,
    transfer,
    Component
}