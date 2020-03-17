
function mount(vnode, container) {
    const {vtype} = vnode
    if(!vtype) {
        // 文本
        mountText(vnode, container)
    }else if(vtype === 1){
        mountHtml(vnode, container)
    }else if(vtype === 2) {
        mountFunc(vnode, container)
    }else if(vtype === 3) {
        mountClass(vnode, container)
    }
}
/** 文本组件 */
function mountText(vnode, container) {
    const textNode = document.createTextNode(vnode)
    container.appendChild(textNode)
}
/** 原生组件 */
function mountHtml(vnode, container) {
    const { type, props } = vnode
    const dom = document.createElement(type)
    const { children, ...rest } = props
    Object.keys(rest).map(v => {
        //事件
        if(v.indexOf('on') === 0){
            dom.addEventListener(v.slice(2), rest[v], false)
        }else {
            // todo className
            dom.setAttrbuite(v, rest[v])
        }
    })
    //递归
    children.map(v => {
        if(Array.isArray(v)) {
            v.forEach(item => {
                mount(item, dom)
            })
        }else{
            mount(v, dom)
        }
    })
    container.appendChild(dom)
}
/** 函数组件 */
function mountFunc(vnode, container) {
    const {type, props} = vnode
    const node = type(props)
    mount(node, container)
}
/** class 组件 */
function mountClass(vnode, container) {
    const {type, props} = vnode
    const ctor = new type(props)
    const node = ctor.render()
    mount(node, container)
}

function render(vnode, container) {
    mount(vnode, container)
}

export default {
    render
}