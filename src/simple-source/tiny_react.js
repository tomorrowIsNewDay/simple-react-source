/**
 * 
 * @param {*} type //0:文本 1: 原生 3: function组件 4:class组件
 * @param {*} props 
 * @param  {...any} children 
 */
function createElement(type, props, ...children) {
    props.children = children
    let vtype
    if(typeof type === 'string') {
        vtype = 1
    }else if(typeof type === 'function') {
        vtype = type.isReactComponent ? 3 : 2
    }
    return {
        vtype,
        type,
        props
    }

}

/**
 * Component
 */
class Component {
    static isReactComponent = true
    constructor(props) {
        this.props = props
        this.state = {}
    }
    setState() {

    }
    render() {

    }
}

const React = {
    createElement,
    Component
}

export default React