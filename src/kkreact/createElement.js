import {
  VTEXT,
  VELEMENT,
  VSTATELESS,
  VCOMPONENT
} from './constant'
import { createVnode } from './virtual-dom'

// 第一个核心api 构建虚拟dom的object
export default function createElement(type, props, ...children) {
  let vtype = null
  if (typeof type === 'string') {
    vtype = VELEMENT
  } else if (typeof type === 'function') {
    if (type && type.isReactComponent) {
      vtype = VCOMPONENT
    } else {
      vtype = VSTATELESS
    }
  } else {
    vtype = VTEXT

    //throw new Error(`React.createElement: unexpect type [ ${type} ]`)
  }

  // finalProps.children = children
  props.children = children

  return createVnode(vtype, type, props)//, key, ref)
}

